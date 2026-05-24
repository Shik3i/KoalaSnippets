# CI/CD Runbook — KoalaSnippets

Dieses Dokument definiert die verbindliche Checkliste vor jedem Release-Tag. Jede Abweichung muss dokumentiert und genehmigt werden.

## 1. Pre-Release Build Audit

Bevor ein Version-Tag (`vX.Y.Z`) erstellt wird, MUSS folgendes in einer **frischen, isolierten Umgebung** validiert werden:

### 1.1 Clean Install Test
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```
Ziel: Sicherstellen, dass `package-lock.json` korrekt generiert wird und keine Abhängigkeitskonflikte auftreten.

### 1.2 Docker Build Simulation
Der lokale Build reicht nicht. Next.js verhält sich im Docker-Builder anders:

| Lokal (Dev) | Docker Builder |
|-------------|----------------|
| `.env` existiert | Kein `.env` vorhanden |
| SQLite-DB existiert unter `./data/` | Kein `data/`-Verzeichnis |
| `node_modules` vorhanden | Frischer `npm install` |
| `NODE_ENV=development` | `NODE_ENV=production` |

**Pflicht-Checkliste für Docker-Kompatibilität:**

- [ ] Alle API-Routes, die DB-Zugriffe oder Filesystem-Operationen ausführen, haben `export const dynamic = "force-dynamic"` gesetzt. Ohne dies versucht Next.js statisches Rendering zur Build-Zeit und crasht wenn die DB nicht existiert.
- [ ] Das Dockerfile setzt **Dummy-Werte** für alle Environment-Variablen, die zur Build-Zeit von Next.js evaluiert werden (z.B. `AUTH_PEPPER`, `SESSION_SECRET`). Diese werden zur Runtime durch `docker-compose.yml` überschrieben.
- [ ] Der `deps`-Stage verwendet `npm install` statt `npm ci`, da lockfile-Versionen zwischen lokalem npm und Alpine npm abweichen können.
- [ ] Die `.env.example` enthält alle benötigten Variablen mit klaren Platzhaltern.

### 1.3 Workflow-Trigger Prüfung
- [ ] Der GitHub Actions Workflow hat **keine sich überschneidenden Trigger**. Ein Tag-Push auf `main` darf nicht sowohl den `branches`- als auch den `tags`-Trigger feuern.
- [ ] Regel: Docker-Builds werden **ausschließlich durch Tags** (`v*`) getriggert, nicht durch Branch-Pushes.

## 2. Release-Prozess

```bash
# 1. Alle Änderungen committen und pushen
git add -A
git commit -m "fix: ..."
git push

# 2. Build lokal verifizieren
npm run build

# 3. Tag erstellen und pushen (löst CI/CD aus)
git tag v1.0.0
git push origin v1.0.0
```

### 2.1 Tag-Konvention
- Format: `vMAJOR.MINOR.PATCH` (z.B. `v1.0.0`, `v1.2.3`)
- Jeder Tag produziert Docker-Images mit: `sha-xxxx`, `latest`, `1.0.0`, `1.0`, `1`
- **NIEMALS** einen bestehenden Tag löschen und neu erstellen, es sei denn es handelt sich um einen kritischen Hotfix innerhalb von 5 Minuten.

### 2.2 Nach dem Push
1. Build-Status prüfen: https://github.com/Shik3i/KoalaSnippets/actions
2. GHCR Package prüfen: https://github.com/Shik3i/KoalaSnippets/pkgs/container/koalasnippets
3. Erwartete Tags verifizieren: `latest`, `1.0.0`, `1.0`, `1`, `sha-xxxx`

## 3. Bekannte Fallstricke

### 3.1 Next.js Build-Time Environment Variables
Next.js evaluiert `process.env.*` zur **Build-Zeit**. Wenn Code wie `if (!process.env.AUTH_PEPPER) throw ...` existiert, crasht der Build wenn die Variable nicht gesetzt ist — auch wenn sie zur Runtime vorhanden wäre.

**Lösung:** Dockerfile-Builder-Stage mit Dummy-Werten versorgen:
```dockerfile
ENV AUTH_PEPPER="build-time-dummy-pepper-ignore"
ENV SESSION_SECRET="build-time-dummy-secret-ignore"
```

### 3.2 Statische vs. Dynamische Route-Generierung
Next.js 16 versucht standardmäßig, Routes zur Build-Zeit statisch zu rendern. API-Routes die DB-Zugriffe machen crasht dabei wenn keine DB vorhanden ist.

**Lösung:** Jede API-Route mit DB/Filesystem-Zugriff braucht:
```typescript
export const dynamic = "force-dynamic";
```

### 3.2b `generateStaticParams()` zur Build-Zeit (⚠️ HÄUFIGER DOCKER-CRASH)
`generateStaticParams()` wird von Next.js **während `next build`** ausgeführt — nicht erst zur Laufzeit. Wenn diese Funktion SQLite abfragt, crasht der Docker-Build weil `./data/` im Builder-Stage nicht existiert.

**Fehlermeldung:**
```
TypeError: Cannot open database because the directory does not exist
Error: Failed to collect page data for /snippets/[id]
```

**Lösung:** `generateStaticParams()` IMMER mit try/catch schützen:
```typescript
export async function generateStaticParams() {
  try {
    const items = await db.select().from(myTable).all();
    return items.map((i) => ({ id: i.id }));
  } catch {
    return []; // DB nicht verfügbar (Docker-Build) → keine statischen Seiten
  }
}
```

Und im Dockerfile sicherstellen, dass das DB-Verzeichnis existiert:
```dockerfile
RUN mkdir -p /app/data /app/backups
```

### 3.3 npm ci vs. npm install in Alpine
`npm ci` verlangt eine exakte Übereinstimmung zwischen `package.json` und `package-lock.json`. Alpine Linux verwendet teilweise andere npm-Versionen, was zu lockfile-Version-Konflikten führt.

**Lösung:** Im Dockerfile `npm install` verwenden statt `npm ci`.

### 3.5 Migration Journal Korruption (⚠️ Silent Runtime Crash)
Wenn eine Migration gelöscht oder umbenannt wird, aber der Eintrag im `_journal.json` bestehen bleibt, crasht der Drizzle-Migrator beim Start **lautlos** (der Fehler wird in `instrumentation.ts` gecatcht). Die Folge: alle nachfolgenden Migrationen werden nie ausgeführt.

**Symptom:** "Server Components render" Fehler auf Seiten die neue DB-Spalten/Tabellen verwenden, obwohl der Build erfolgreich war.

**Lösung:**
1. `npm run db:generate` immer ausführen, NIE manuell Migration-Dateien löschen/umbenennen
2. Falls eine Migration gelöscht werden muss: `_journal.json` bereinigen UND `drizzle-kit generate` neu ausführen
3. Vor jedem Push: `npm test` ausführen — `migration-integrity.test.ts` prüft ob alle Journal-Einträge gültige SQL-Dateien haben
Wenn der Workflow auf `push: branches: [main]` UND `push: tags: ['v*']` hört, erzeugt ein Tag-Push auf `main` **zwei parallele Builds**.

**Lösung:** Nur `push: tags: ['v*']` verwenden.

## 4. Notfall-Checkliste

Wenn der CI/CD-Build fehlschlägt:

1. **Fehlermeldung lesen** — Nicht raten, die exakte Fehlermeldung analysieren
2. **Lokal reproduzieren** — `docker build --target builder .` simuliert den CI-Build
3. **Umgebungsunterschiede prüfen** — Was existiert lokal aber nicht im Docker-Container?
4. **Fix committen, Tag löschen, neuen Tag erstellen** — Nicht den gleichen Tag wiederverwenden

```bash
# Tag löschen (lokal + remote)
git tag -d v1.0.0
git push origin :refs/tags/v1.0.0

# Fix committen und pushen
git add -A && git commit -m "fix: ..." && git push

# Neuen Tag erstellen
git tag v1.0.1
git push origin v1.0.1
```
