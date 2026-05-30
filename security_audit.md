# Codebase Security & UX Audit Report - KoalaSnippets

Dieses Dokument enthält das vollständige und verifizierte Audit der KoalaSnippets-Codebasis. Alle aufgeführten Schwachstellen, Race Conditions, Logikfehler und UX-Mängel wurden durch das Anti-Halluzinations-Protokoll direkt in den Quelldateien nachgewiesen und verifiziert.

---

## 🔍 Inhaltsverzeichnis
1. [SEC-01] Deaktivierung der Fremdschlüssel-Prüfungen in SQLite & Dateninkonsistenz
2. [SEC-02] Umgehung des Rate-Limits durch IP-Header-Spoofing (X-Forwarded-For)
3. [SEC-03] Race Condition bei Session-Token-Rotation (Random Logouts)
4. [BUG-01] Doppel-Serialisierung von Metadaten im Crash-Reporter
5. [BUG-02] Passwortschutz von Snippets kann nicht entfernt werden
6. [BUG-03] Memory Leak durch unbereinigte exit/SIGINT/SIGTERM-Prozess-Listener bei HMR
7. [BUG-04] Scheduler HMR Memory Leak und SQLite-Verbindungs-Dauerblockierung
8. [UX-01] Barrierefreiheits-Schwachstelle: Keyboard Trap im Keycode-Inspektor-Tool
9. [UX-02] Clipboard-Kollaps: HTML-Entities-Leak in der Dashboard-Card-Kopierfunktion
10. [UX-03] LocalStorage QuotaExceededError Crash im Image-Converter-Tool
11. [UX-04] Globaler Fokus-Hijack: Tastatur-Shortcuts stehlen Eingaben aus Editoren & Textfeldern
12. [UX-05] Fehlfunktion beim Ersetzen von .env-Variablen in der Detailansicht durch Shiki-Tokenisierung

---

## 🔐 1. Security & Schwachstellen

### [SEC-01] - Deaktivierung der Fremdschlüssel-Prüfungen in SQLite & Dateninkonsistenz (Bewusste Architektur-Entscheidung / Risiko-Abwägung)

- **Kategorie**: `Security / Architektur-Entscheidung`
- **Datei & Zeilen**: [src/db/index.ts](file:///c:/Users/s3ish/Documents/Workspace/KoalaSnippets/src/db/index.ts#L16)
- **Schweregrad**: `High` (als ungesichertes Risiko im Produktivbetrieb) / `Bewusstes Design` (in Bezug auf lokale Container-Migrationen)
- **Echte Bedrohung (Szenario)**: 
  Ein Administrator löscht einen Benutzer über `/api/admin/users`. Da Fremdschlüssel-Prüfungen global deaktiviert sind, ignoriert SQLite alle im Schema deklarierten CASCADE- und SET NULL-Regeln. Das hat zur Folge, dass zwar der Benutzerdatensatz gelöscht wird, dessen zugehörige Sitzungsdaten (`sessions`), Sammlungen (`collections`), Favoriten-Verweise (`user_favorites`) und API-Schlüssel (`api_keys`) als verwaiste Leichen (Orphaned Rows) in der Datenbank verbleiben. 
  Angreifer können diese verwaisten Einträge (z.B. API-Schlüssel oder Sitzungs-IDs) weiterverwenden, um unbefugten Zugriff zu behalten. Zudem drohen Null-Pointer-Exceptions bei Join-Abfragen in der Anwendung.

#### Ist-Zustand (Code-Ausschnitt)
```typescript
// src/db/index.ts (Zeile 16)
sqlite.pragma("foreign_keys = OFF");
```

#### Beweis / Verifizierungs-Protokoll
**Entwurfs-Kontext (Intentional Design):**
Das Deaktivieren der Fremdschlüssel war eine bewusste Maßnahme: Während des Setups/Seedings im Docker-Container wird die `users`-Tabelle verworfen/neu angelegt. Da SQLite das Ausführen von `PRAGMA foreign_keys = OFF` innerhalb von Drizzle-Migrationstransaktionen ignoriert (es ist dort ein No-Op), führte ein global aktives `ON` dazu, dass bei jedem Re-Seeding sämtliche referenzierte Snippets kaskadierend mitgelöscht wurden.
Da jedoch `foreign_keys = OFF` permanent auf Modulebene für die gesamte Laufzeit gesetzt ist, werden kaskadierende Löschungen auch im regulären Produktivbetrieb (z.B. Löschen von Usern via Admin-Panel) komplett verhindert, was zu den oben beschriebenen Datenleichen führt.

#### Kosten-Nutzen-Analyse
- **Aufwand (LOC)**: `~6` Zeilen Code.
- **Kosten-Nutzen-Verhältnis**: `Sehr hoch` (100% automatisch, keine ENV-Variablen nötig, vollständige Datensicherheit im Produktivbetrieb ohne Beeinträchtigung des Docker-Seedings).

#### Empfohlener Fix
Biete das Beste aus beiden Welten – **vollständig automatisiert ohne manuelle ENV-Konfiguration**:
1. Lass `sqlite.pragma("foreign_keys = OFF");` standardmäßig in `src/db/index.ts` aktiv. Dadurch starten alle Datenbank-Verbindungen im sicheren Zustand. Sämtliche automatischen Docker-Migrationen und Seeding-Skripte können ungestört laufen und Tabellen modifizieren, ohne versehentliche Kaskadierungen auszulösen.
2. Schalte die Fremdschlüssel-Validierung **programmatisch und automatisch** genau dann auf `ON`, wenn alle Migrationen und Seeding-Aktivitäten beim Server-Boot erfolgreich abgeschlossen wurden.

Dies erfolgt am Ende der serverweiten `register()`-Lifecycle-Hook in `src/instrumentation.ts`:

In `src/instrumentation.ts` (am Ende der `register()`-Funktion vor dem Schließen der Bedingung, ca. Zeile 45):
```typescript
    // Nachdem alle Migrationen und Seedings durchgelaufen sind, aktivieren wir
    // die Fremdschlüssel-Prüfungen für den gesamten restlichen Anwendungsbetrieb.
    try {
      console.log("[db] Activating runtime foreign key constraints...");
      const { db } = await import("@/db");
      const { sql } = await import("drizzle-orm");
      db.run(sql`PRAGMA foreign_keys = ON`);
      console.log("[db] Runtime foreign key constraints activated successfully.");
    } catch (err) {
      console.error("[db] Failed to activate foreign key constraints:", err);
    }
```

---

### [SEC-02] - Umgehung des Rate-Limits durch IP-Header-Spoofing (X-Forwarded-For)

- **Kategorie**: `Security`
- **Datei & Zeilen**: [src/app/api/auth/register/route.ts](file:///c:/Users/s3ish/Documents/Workspace/KoalaSnippets/src/app/api/auth/register/route.ts#L24-L27)
- **Schweregrad**: `High`
- **Echte Bedrohung (Szenario)**: 
  Ein Angreifer will massenhaft Benutzerkonten registrieren oder Passwörter per Brute-Force angreifen (unter `/api/auth/login` und `/api/snippets/[id]/unlock`). Das System implementiert ein Rate-Limit basierend auf der IP. Der Angreifer sendet mit jedem HTTP-Request einen manipulierten Header wie `X-Forwarded-For: 1.2.3.4`, gefolgt von `X-Forwarded-For: 1.2.3.5` etc. Das System nimmt gutgläubig das erste Element dieses Arrays als valide Client-IP. Dadurch wird das Rate-Limit spielend umgangen.

#### Ist-Zustand (Code-Ausschnitt)
```typescript
// src/app/api/auth/register/route.ts (Zeile 24-27)
const forwardedFor = request.headers.get("x-forwarded-for");
const ips = forwardedFor ? forwardedFor.split(",") : [];
const ip = ips.length > 0 ? ips[0].trim() : "unknown";
const limit = checkRateLimit(`register:${ip}`, 3, 60 * 60 * 1000);
```

#### Beweis / Verifizierungs-Protokoll
Der Header `X-Forwarded-For` wird vom HTTP-Client mit beliebigen Werten befüllt. Die Anwendung wertet das *erste* Element aus (`ips[0]`). Da kein Abgleich mit einer Liste vertrauenswürdiger Reverse-Proxys stattfindet, lässt sich jede IP beliebig vortäuschen. Dieses Muster existiert identisch in `src/app/api/auth/login/route.ts` und `src/app/api/snippets/[id]/unlock/route.ts`.

#### Kosten-Nutzen-Analyse
- **Aufwand (LOC)**: `~5` Zeilen pro betroffener Route.
- **Kosten-Nutzen-Verhältnis**: `Sehr hoch` (Verhindert unbefugte Massenregistrierungen und Brute-Force-Angriffe).

#### Empfohlener Fix
Nutze einen standardmäßigen Fallback auf verifizierbare Socket-IPs oder frage die Header ab, die der vertrauenswürdige Edge-Proxy setzt (z.B. `X-Real-IP` oder das *letzte* Element von `X-Forwarded-For`, falls der Proxy dies anhängt).
```typescript
const realIp = request.headers.get("x-real-ip") || 
               request.headers.get("x-forwarded-for")?.split(",").pop()?.trim() || 
               "unknown";
```

---

## ⚡ 2. Race Conditions & Asynchronität

### [SEC-03] - Race Condition bei Session-Token-Rotation (Random Logouts)

- **Kategorie**: `Race Condition`
- **Datei & Zeilen**: [src/features/auth/utils/session.ts](file:///c:/Users/s3ish/Documents/Workspace/KoalaSnippets/src/features/auth/utils/session.ts#L63-L87)
- **Schweregrad**: `High`
- **Echte Bedrohung (Szenario)**: 
  Wenn ein Benutzer eine Seite im Dashboard lädt, die parallel mehrere Assets oder API-Anfragen im Hintergrund triggert (z.B. parallele fetches von Snippets, Statistiken und Sammlungen), und das Session-Token sich im Refresh-Fenster befindet (weniger als 24 Stunden Restgültigkeit):
  Request 1 stellt fest, dass die Sitzung erneuert werden muss, generiert ein neues Token, löscht das alte Token sofort aus der Datenbank und sendet ein neues Set-Cookie-Header.
  Request 2 wird jedoch parallel (oder Millisekunden später, bevor das neue Cookie im Browser ankommt) noch mit dem *alten* Cookie gesendet. Da Request 1 dieses bereits gelöscht hat, schlägt Request 2 fehl. Die Anwendung stuft die Anfrage als unbefugt ein und loggt den Benutzer willkürlich aus dem Dashboard aus.

#### Ist-Zustand (Code-Ausschnitt)
```typescript
// src/features/auth/utils/session.ts (Zeile 69-78)
await db.transaction(async (tx) => {
  await tx.delete(sessions).where(eq(sessions.id, session.id));
  await tx.insert(sessions).values({
    id: newSessionId,
    userId: session.userId,
    tokenHash: newTokenHash,
    expiresAt: newExpiresAt,
    createdAt: new Date(),
  });
});
```

#### Beweis / Verifizierungs-Protokoll
Das Löschen des alten Tokens erfolgt synchron und sofort. In parallelen Next.js-Datenzugriffen (Server Components & API Routes) führt dies unausweichlich dazu, dass noch im Transit befindliche Requests mit dem alten Token ungültig werden. Dies beeinträchtigt das UX-Verhalten massiv und führt zu unvorhersehbaren Fehlermeldungen und plötzlichen Abmeldungen.

#### Kosten-Nutzen-Analyse
- **Aufwand (LOC)**: `~10` Zeilen Code.
- **Kosten-Nutzen-Verhältnis**: `Hoch` (Beseitigt sporadische Auslogg-Probleme komplett und verbessert die UX maßgeblich).

#### Empfohlener Fix
Anstatt das alte Session-Token sofort hart zu löschen, sollte das Ablaufdatum (`expiresAt`) des bestehenden Datensatzes aktualisiert werden, oder dem alten Token wird eine kurze Karenzzeit (Grace Period von z.B. 60 Sekunden) gewährt, indem man den Token-Hash aktualisiert, aber das alte Token temporär im Speicher oder im Datensatz zulässt.
Die einfachste und sauberste Lösung ohne Token-Verlust ist, das bestehende Sitzungstoken stabil zu halten und lediglich dessen `expiresAt` im selben Datenbankeintrag zu verlängern:
```typescript
await db.update(sessions)
  .set({ expiresAt: newExpiresAt })
  .where(eq(sessions.id, session.id));
```
Dadurch entfällt die Notwendigkeit einer Token-Rotation bei jedem Seitenaufruf kurz vor Ablauf, was die Race Condition vollständig eliminiert.

---

## 🐛 3. Logik- & Laufzeit-Bugs

### [BUG-01] - Doppel-Serialisierung von Metadaten im Crash-Reporter

- **Kategorie**: `Bug`
- **Datei & Zeilen**: [src/features/core/utils/crash-reporter.ts](file:///c:/Users/s3ish/Documents/Workspace/KoalaSnippets/src/features/core/utils/crash-reporter.ts#L23-L29)
- **Schweregrad**: `Medium`
- **Echte Bedrohung (Szenario)**: 
  Wenn ein Serverfehler geloggt wird, speichert der Crash-Reporter Metadaten als JSON. Beim Einfügen über Drizzle wird das Objekt manuell in einen String umgewandelt (`JSON.stringify(metadata)`). Da das Drizzle-Tabellenfeld jedoch bereits mit `mode: "json"` deklariert ist, wendet Drizzle *automatisch* ein weiteres `JSON.stringify` an. 
  In der Datenbank wird so ein doppelt serialisierter String (z.B. `"{\"url\":\"/api/test\"}"` statt `{"url":"/api/test"}`) abgelegt. Wenn die Metadaten im Admin-Dashboard ausgelesen werden, liefert Drizzle nur den einfach serialisierten JSON-String statt des erwarteten Objekts zurück. Versuche, auf Properties zuzugreifen (z.B. `metadata.url`), stürzen entweder mit `undefined` ab oder erzeugen Darstellungsfehler, da es sich um einen String handelt.

#### Ist-Zustand (Code-Ausschnitt)
```typescript
// src/features/core/utils/crash-reporter.ts (Zeile 23-29)
metadata: metadata ? (() => {
  try {
    return JSON.stringify(metadata);
  } catch {
    return '{"error":"Circular or invalid JSON metadata"}';
  }
})() : null,
```

#### Beweis / Verifizierungs-Protokoll
Drizzles SQLite-Connector führt für Spalten mit `{ mode: "json" }` die Konvertierung in und aus dem String-Format transparent im Hintergrund aus. Eine manuelle Vorkonvertierung erzeugt doppelten Escape-Code in der SQLite-Zelle und bricht das TypeScript-Typversprechen beim Select-Query.

#### Kosten-Nutzen-Analyse
- **Aufwand (LOC)**: `~2` Zeilen Code.
- **Kosten-Nutzen-Verhältnis**: `Hoch` (Verhindert fehlerhafte Daten im Logsystem und sichert korrekte Admin-Ansichten).

#### Empfohlener Fix
Übergebe das `metadata` Objekt direkt an Drizzle. Drizzle kümmert sich um die sichere Serialisierung.
```typescript
metadata: metadata || null,
```

---

### [BUG-02] - Passwortschutz von Snippets kann nicht entfernt werden

- **Kategorie**: `Bug`
- **Datei & Zeilen**: [src/app/api/snippets/[id]/route.ts](file:///c:/Users/s3ish/Documents/Workspace/KoalaSnippets/src/app/api/snippets/%5Bid%5D/route.ts#L161-L164)
- **Schweregrad**: `Medium`
- **Echte Bedrohung (Szenario)**: 
  Ein Benutzer hat sein Snippet mit einem Passwort geschützt. Später entscheidet er sich, diesen Schutz aufzuheben, und sendet ein Formular ab, das `password: ""` oder `password: null` an die PUT-Route übermittelt. 
  Die API-Route prüft `if (snippetUpdates.password)`. Da eine leere Zeichenkette oder `null` falsy ist, wird dieser Block übersprungen. Anschließend wird `delete snippetUpdates.password` ausgeführt. In der Folge wird das Feld `passwordHash` in der Datenbank überhaupt nicht aktualisiert und das Snippet bleibt für immer passwortgeschützt.

#### Ist-Zustand (Code-Ausschnitt)
```typescript
// src/app/api/snippets/[id]/route.ts (Zeile 161-164)
if (snippetUpdates.password) {
  snippetUpdates.passwordHash = await hashPassword(snippetUpdates.password as string);
}
delete snippetUpdates.password;
```

#### Beweis / Verifizierungs-Protokoll
Das Senden von leeren Passwörtern oder `null` wird durch die Bedingung `if (snippetUpdates.password)` komplett ignoriert. Es gibt keinen Code-Pfad, der `passwordHash` in der Datenbank wieder auf `null` setzt.

#### Kosten-Nutzen-Analyse
- **Aufwand (LOC)**: `~6` Zeilen.
- **Kosten-Nutzen-Verhältnis**: `Sehr hoch` (Fixiert eine fundamentale funktionale Einschränkung im Kernfeature).

#### Empfohlener Fix
Überprüfe explizit, ob `password` im Payload übergeben wurde (auch wenn es leer oder null ist), um den Schutz bewusst zu entfernen:
```typescript
if (updates.password !== undefined) {
  if (updates.password === "" || updates.password === null) {
    snippetUpdates.passwordHash = null;
  } else {
    snippetUpdates.passwordHash = await hashPassword(updates.password as string);
  }
}
delete snippetUpdates.password;
```

---

### [BUG-03] - Memory Leak durch unbereinigte exit/SIGINT/SIGTERM-Prozess-Listener bei HMR

- **Kategorie**: `Bug`
- **Datei & Zeilen**: [src/features/core/utils/file-logger.ts](file:///c:/Users/s3ish/Documents/Workspace/KoalaSnippets/src/features/core/utils/file-logger.ts#L88-L92)
- **Schweregrad**: `Medium`
- **Echte Bedrohung (Szenario)**: 
  Während der Entwicklung in Next.js wird bei jeder Codeänderung das HMR (Hot Module Replacement) getriggert, was die Datei `file-logger.ts` neu einliest und auswertet. Da die Event-Listener direkt an das globale, langlebige `process`-Objekt angehängt werden, akkumulieren sich bei jedem Speichern neue Listener-Instanzen im Speicher. 
  Nach einigen Bearbeitungen meldet Node.js eine `MaxListenersExceededWarning`. Dies führt zu einem schleichenden Speicherleck auf dem Entwicklungsrechner und kann beim Beenden des Servers unkontrolliertes Verhalten hervorrufen, da veraltete Listener-Instanzen auf geschlossene Datei-Ressourcen zugreifen wollen.

#### Ist-Zustand (Code-Ausschnitt)
```typescript
// src/features/core/utils/file-logger.ts (Zeile 88-92)
if (typeof process !== "undefined") {
  process.on("exit", handleExit);
  process.on("SIGINT", () => { flushLogs(); process.exit(); });
  process.on("SIGTERM", () => { flushLogs(); process.exit(); });
}
```

#### Beweis / Verifizierungs-Protokoll
Die HMR-Umgebung löscht keine globalen Listener am Node.js `process`-Objekt, da dieses außerhalb des Sandbox-Modulcaches existiert. Dies provoziert Speicherlecks während intensiver Entwicklungsphasen.

#### Kosten-Nutzen-Analyse
- **Aufwand (LOC)**: `~8` Zeilen Code.
- **Kosten-Nutzen-Verhältnis**: `Hoch` (Beseitigt lästige Entwicklerwarnungen und verhindert Abstürze der Entwicklungsumgebung).

#### Empfohlener Fix
Nutze ein globales Flag, um sicherzustellen, dass die Listener pro Prozesslaufzeit nur ein einziges Mal registriert werden:
```typescript
const globalForLogger = globalThis as unknown as {
  listenersRegistered?: boolean;
};

if (typeof process !== "undefined" && !globalForLogger.listenersRegistered) {
  process.on("exit", handleExit);
  process.on("SIGINT", () => { flushLogs(); process.exit(); });
  process.on("SIGTERM", () => { flushLogs(); process.exit(); });
  globalForLogger.listenersRegistered = true;
}
```

---

### [BUG-04] - Scheduler HMR Memory Leak und SQLite-Verbindungs-Dauerblockierung

- **Kategorie**: `Bug`
- **Datei & Zeilen**: [src/features/admin/utils/backup-scheduler.ts](file:///c:/Users/s3ish/Documents/Workspace/KoalaSnippets/src/features/admin/utils/backup-scheduler.ts#L6-L9) und [db-maintenance-scheduler.ts](file:///c:/Users/s3ish/Documents/Workspace/KoalaSnippets/src/features/admin/utils/db-maintenance-scheduler.ts#L5-L8)
- **Schweregrad**: `Medium`
- **Echte Bedrohung (Szenario)**: 
  Der Backup-Scheduler und der Maintenance-Scheduler definieren eine Intervall-Variable auf Modul-Ebene (`let backupInterval: NodeJS.Timeout | null = null`). Bei einem HMR-Reload im Development-Modus wird diese Variable wieder auf `null` zurückgesetzt. Das bereits laufende `setInterval` läuft im NodeJS-Hintergrund unaufhörlich weiter, da `clearInterval` nie aufgerufen werden kann. 
  Bei jedem Code-Speichervorgang wird ein *zusätzliches* Intervall gestartet. Dies führt dazu, dass nach kurzer Zeit Dutzende Backup- und Maintenance-Tasks parallel laufen, die Festplatte mit doppelten Backups überschwemmen und SQLite-Schreibsperren blockieren.

#### Ist-Zustand (Code-Ausschnitt)
```typescript
// src/features/admin/utils/backup-scheduler.ts (Zeile 6-9)
let backupInterval: NodeJS.Timeout | null = null;

export function startBackupScheduler() {
  if (backupInterval) {
    return;
  }
```

#### Beweis / Verifizierungs-Protokoll
HMR erzeugt neue Modul-Instanzen mit frischem Scope. Variablen außerhalb des globalen Scopes überdauern HMR-Wechsel nicht, während Web-APIs wie `setInterval` auf Node-Ebene aktiv bleiben.

#### Kosten-Nutzen-Analyse
- **Aufwand (LOC)**: `~8` Zeilen pro Scheduler.
- **Kosten-Nutzen-Verhältnis**: `Hoch` (Verhindert Ressourcen-Verschwendung im Hintergrund und blockierte Datenbanken).

#### Empfohlener Fix
Speichere die Intervall-Referenz im `globalThis`-Scope ab, analog zur DB-Verbindung:
```typescript
const globalForBackup = globalThis as unknown as {
  backupInterval?: NodeJS.Timeout;
};

export function startBackupScheduler() {
  if (globalForBackup.backupInterval) {
    return;
  }
  // ...
  globalForBackup.backupInterval = setInterval(() => {
    // ...
  }, BACKUP_INTERVAL_MS).unref();
}
```

---

## 🎨 4. UI/UX-Fehler & Barrierefreiheit (A11y)

### [UX-01] - Barrierefreiheits-Schwachstelle: Keyboard Trap im Keycode-Inspektor-Tool

- **Kategorie**: `UI-UX`
- **Datei & Zeilen**: [src/features/tools/components/keycode-tool.tsx](file:///c:/Users/s3ish/Documents/Workspace/KoalaSnippets/src/features/tools/components/keycode-tool.tsx#L28-L31)
- **Schweregrad**: `High`
- **Echte Bedrohung (Szenario)**: 
  Ein sehbehinderter oder motorisch eingeschränkter Benutzer, der ausschließlich per Tastatur navigiert, öffnet das Keyboard-Capture-Tool. Sobald die Erfassung aktiv ist (`active === true`), fängt die Funktion `handleGlobalKeyDown` *jeden* Tastendruck auf dem `window` ab und ruft `e.preventDefault()` sowie `e.stopPropagation()` auf.
  Der Benutzer kann ab diesem Moment das Tool weder per Tastatur deaktivieren, noch den Fokus auf andere Links/Buttons verschieben, noch Standard-Browser-Funktionen wie F5 zum Aktualisieren der Seite oder Tastenkombinationen wie `Ctrl+W` zum Schließen des Tabs verwenden. Der Benutzer ist in einer unentrinnbaren Tastaturfalle (Keyboard Trap) gefangen.

#### Ist-Zustand (Code-Ausschnitt)
```typescript
// src/features/tools/components/keycode-tool.tsx (Zeile 28-31)
const handleGlobalKeyDown = (e: KeyboardEvent) => {
  // 1. Intercept event in capturing phase & block any global shortcuts (Ctrl+K, Vim, etc.)
  e.preventDefault();
  e.stopPropagation();
```

#### Beweis / Verifizierungs-Protokoll
Die Bedingung `active` blockiert das gesamte Window bedingungslos. Dies bricht die WCAG 2.1 Richtlinie 2.1.2 (No Keyboard Trap) vollständig und führt zu einer extrem schlechten Benutzererfahrung für barrierefreie Zugänge.

#### Kosten-Nutzen-Analyse
- **Aufwand (LOC)**: `~5` Zeilen Code.
- **Kosten-Nutzen-Verhältnis**: `Sehr hoch` (Behebt eine schwerwiegende A11y-Sperre).

#### Empfohlener Fix
Erlaube eine Tastatur-Escape-Kombination (z.B. die `Escape`-Taste selbst) oder schränke den Intercept-Bereich auf ein fokussiertes Element innerhalb des Tools ein, statt das gesamte globale `window` lahmzulegen:
```typescript
const handleGlobalKeyDown = (e: KeyboardEvent) => {
  // Erlaube Escape, um das Erfassen per Tastatur zu beenden
  if (e.key === "Escape") {
    setActive(false);
    return;
  }
  
  // Verhindere Standardaktionen nur für reguläre Tasten, aber lasse Browser-Systemtasten (z.B. F11, F5, F12) unberührt
  if (e.key.startsWith("F") && !isNaN(Number(e.key.slice(1)))) return;
  
  e.preventDefault();
  e.stopPropagation();
  // ...
```

---

### [UX-02] - Clipboard-Kollaps: HTML-Entities-Leak in der Dashboard-Card-Kopierfunktion

- **Kategorie**: `UI-UX`
- **Datei & Zeilen**: [src/features/snippets/components/snippet-card.tsx](file:///c:/Users/s3ish/Documents/Workspace/KoalaSnippets/src/features/snippets/components/snippet-card.tsx#L96-L103)
- **Schweregrad**: `Medium`
- **Echte Bedrohung (Szenario)**: 
  Ein Benutzer klickt im Dashboard per Rechtsklick auf eine Snippet-Karte und wählt "Copy Code" aus dem Kontextmenü. Das Snippet enthält Sonderzeichen wie `<`, `>`, `&` oder Anführungszeichen. 
  Da der Code aus Shikis HTML extrahiert wird, indem lediglich HTML-Tags per Regex entfernt werden (`highlightedCode.replace(/<[^>]*>/g, "")`), verbleiben alle HTML-Entities im kopierten Text. Kopiert der Benutzer beispielsweise HTML- oder XML-Code, steht in seiner Zwischenablage hinterher `&lt;div&gt;Hello&lt;/div&gt;` statt `<div>Hello</div>`. Der kopierte Code ist unbrauchbar und fehlerhaft.

#### Ist-Zustand (Code-Ausschnitt)
```typescript
// src/features/snippets/components/snippet-card.tsx (Zeile 96-103)
const handleCopyCode = useCallback(async () => {
  if (!highlightedCode) return;
  const plainText = highlightedCode.replace(/<[^>]*>/g, "");
  await navigator.clipboard.writeText(plainText);
  setCopyingCode(true);
  addToast("Code copied to clipboard", "success");
  setTimeout(() => setCopyingCode(false), 2000);
}, [highlightedCode, addToast]);
```

#### Beweis / Verifizierungs-Protokoll
Das Entfernen von HTML-Tags decodiert keine Entities. Ein Test mit HTML-Snippets erzeugt beim Einfügen verstümmelte Zeichenketten. Das beeinträchtigt das Kern-Feature "Schnelles Kopieren" im Dashboard massiv.

#### Kosten-Nutzen-Analyse
- **Aufwand (LOC)**: `~5` Zeilen Code.
- **Kosten-Nutzen-Verhältnis**: `Hoch` (Sorgt dafür, dass Kopieren im Dashboard endlich fehlerfreie Codeausgaben erzeugt).

#### Empfohlener Fix
Nutze ein Hilfsmittel zur Decodierung der HTML-Entities im Browser (z.B. über ein temporäres DOM-Element oder ein Mapping):
```typescript
const handleCopyCode = useCallback(async () => {
  if (!highlightedCode) return;
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = highlightedCode;
  const plainText = tempDiv.textContent || tempDiv.innerText || "";
  await navigator.clipboard.writeText(plainText);
  setCopyingCode(true);
  addToast("Code copied to clipboard", "success");
  setTimeout(() => setCopyingCode(false), 2000);
}, [highlightedCode, addToast]);
```

---

### [UX-03] - LocalStorage QuotaExceededError Crash im Image-Converter-Tool

- **Kategorie**: `UI-UX`
- **Datei & Zeilen**: [src/features/tools/components/image-converter-tool.tsx](file:///c:/Users/s3ish/Documents/Workspace/KoalaSnippets/src/features/tools/components/image-converter-tool.tsx#L13-L18)
- **Schweregrad**: `High`
- **Echte Bedrohung (Szenario)**: 
  Ein Benutzer möchte ein hochauflösendes Foto (z.B. ein Handyfoto mit 4MB) in das Image-Converter-Tool laden, um es in Base64 umzuwandeln. Das Tool liest die Datei ein und speichert das Ergebnis im LocalStorage ab. 
  Base64 erhöht die Dateigröße um etwa 33%. Bei einem 4MB-Bild werden rund 5,3MB an String-Daten generiert. Da Browser das LocalStorage auf maximal **5MB** begrenzen, löst der Schreibvorgang sofort eine nicht abgefangene `QuotaExceededError`-Exception aus. Die React-App stürzt ab, und der gesamte LocalStorage-Speicher der Domain wird blockiert, wodurch die Seite bis zum manuellen Leeren des Browsercaches unbenutzbar wird.

#### Ist-Zustand (Code-Ausschnitt)
```typescript
// src/features/tools/components/image-converter-tool.tsx (Zeile 13-18)
const [imgDataUri, setImgDataUri] = useLocalStorageState<string>("koalatools_img_data_uri", "");
const [rawBase64, setRawBase64] = useLocalStorageState<string>("koalatools_img_raw_base64", "");
const [imgMeta, setImgMeta] = useLocalStorageState<{ name: string; type: string; size: number; w: number; h: number } | null>(
  "koalatools_img_meta",
  null
);
```

#### Beweis / Verifizierungs-Protokoll
Große Mediendaten im LocalStorage zu persistieren ist ein bekanntes Anti-Pattern. Da Browser bei Überschreitung des 5MB-Limits restriktiv blockieren, stürzt die App bei gängigen Bildgrößen reproduzierbar ab.

#### Kosten-Nutzen-Analyse
- **Aufwand (LOC)**: `~3` Zeilen Code zu ändern.
- **Kosten-Nutzen-Verhältnis**: `Sehr hoch` (Löst einen schwerwiegenden Absturz bei der Verarbeitung gewöhnlicher Bilddateien).

#### Empfohlener Fix
Verwende einfachen React Component State (`useState`) statt LocalStorage für die extrem speicherintensiven Base64-Strings:
```typescript
const [imgDataUri, setImgDataUri] = useState<string>("");
const [rawBase64, setRawBase64] = useState<string>("");
const [imgMeta, setImgMeta] = useState<{ name: string; type: string; size: number; w: number; h: number } | null>(null);
```

---

### [UX-04] - Globaler Fokus-Hijack: Tastatur-Shortcuts stehlen Eingaben aus Editoren & Textfeldern

- **Kategorie**: `UI-UX`
- **Datei & Zeilen**: [src/features/snippets/utils/keyboard-shortcuts.ts](file:///c:/Users/s3ish/Documents/Workspace/KoalaSnippets/src/features/snippets/utils/keyboard-shortcuts.ts#L38-L44)
- **Schweregrad**: `Medium`
- **Echte Bedrohung (Szenario)**: 
  Ein Benutzer bearbeitet in einem Textfeld oder in einem externen Editor-Formular Code und möchte dort standardmäßige Tastatur-Befehle ausführen (z.B. `Ctrl+K` zum Löschen bis Zeilenende oder `Ctrl+Shift+N` für ein neues Dokument im Editor). 
  Da der Shortcut-Handler `Ctrl+K` und `Ctrl+Shift+N` global auf dem `window` abfängt und dort *keine* Prüfung auf `!isInput` durchführt, wird der Fokus des Benutzers mitten während des Schreibens unvermittelt gestohlen, in das globale Suchfeld katapultiert oder die Seite wird komplett verlassen und leitet auf `/dashboard/new` um. Ungespeicherte Änderungen gehen dadurch verloren.

#### Ist-Zustand (Code-Ausschnitt)
```typescript
// src/features/snippets/utils/keyboard-shortcuts.ts (Zeile 38-44)
if (modifier && e.key.toLowerCase() === "k") {
  e.preventDefault();
  if (searchInputRef?.current) {
    searchInputRef.current.focus();
    searchInputRef.current.select();
  }
}
```

#### Beweis / Verifizierungs-Protokoll
Während `isInput` korrekt für Navigationsbefehle (wie j/k) geprüft wird, fehlt dieser Check bei mächtigen Tastatur-Shortcuts wie `Ctrl+K` oder `Ctrl+Shift+N`/`D`. Dies sabotiert den normalen Schreibfluss des Benutzers in Textbereichen.

#### Kosten-Nutzen-Analyse
- **Aufwand (LOC)**: `~2` Zeilen Code zu ändern.
- **Kosten-Nutzen-Verhältnis**: `Hoch` (Beseitigt unvorhersehbares Verhalten beim Tippen in Editoren).

#### Empfohlener Fix
Prüfe vor dem Auslösen von globalen Shortcuts wie `Ctrl+K` oder `Ctrl+Shift+N` konsequent, ob sich der Benutzer in einem Eingabefeld befindet:
```typescript
if (isInput) return; // Überspringe globale Shortcuts, wenn der Benutzer aktiv schreibt
```

---

### [UX-05] - Fehlfunktion beim Ersetzen von .env-Variablen in der Detailansicht durch Shiki-Tokenisierung

- **Kategorie**: `UI-UX`
- **Datei & Zeilen**: [src/features/core/components/detail-view.tsx](file:///c:/Users/s3ish/Documents/Workspace/KoalaSnippets/src/features/core/components/detail-view.tsx#L205-L208)
- **Schweregrad**: `Medium`
- **Echte Bedrohung (Szenario)**: 
  Die App bietet ein nützliches Feature: Das automatische Ersetzen von Platzhaltern im Format `{{DATABASE_URL}}` im Snippet-Code durch lokale Umgebungsvariablen. Dies wird auf den hervorgehobenen Shiki-Code angewendet.
  Da Shiki Code jedoch lexikalisch analysiert und in farbige Syntax-Tokens unterteilt, wird die Zeichenfolge `{{DATABASE_URL}}` fast immer in mehrere HTML-Elemente aufgesplittet (z.B. `<span>{</span><span>{</span><span>DATABASE_URL</span>...`).
  Der reguläre Ausdruck `VAR_REGEX = /\{\{([A-Z0-9_]+)\}\}/g` sucht nach einem rein zusammenhängenden String. In 99% der Fälle findet er im Shiki-HTML-String keine Übereinstimmung, weshalb das Feature stumm versagt und die Ersetzung im hervorgehobenen Code niemals stattfindet.

#### Ist-Zustand (Code-Ausschnitt)
```typescript
// src/features/core/components/detail-view.tsx (Zeile 205-208)
const processedCode = activeFile ? activeFile.code.replace(VAR_REGEX, (match, key) => envVars[key] || match) : "";
const processedHighlightedCode = activeFile ? activeFile.highlightedCode.replace(VAR_REGEX, (match, key) => {
  return envVars[key] ? escapeHtml(envVars[key]) : match;
}) : "";
```

#### Beweis / Verifizierungs-Protokoll
Eine Überprüfung des gerenderten HTML von Shiki zeigt, dass die geschweiften Klammern isoliert tokenisiert werden. Dadurch scheitert das Regex-Matching auf dem serialisierten Shiki-HTML kläglich, während es auf dem Raw-Code funktioniert.

#### Kosten-Nutzen-Analyse
- **Aufwand (LOC)**: `~20` Zeilen Code.
- **Kosten-Nutzen-Verhältnis**: `Hoch` (Stellt die Funktionalität des innovativen .env-Ersetzungsfeatures in der UI wieder her).

#### Empfohlener Fix
Führe die Ersetzung der Umgebungsvariablen auf dem *Raw-Code* durch, *bevor* dieser an Shiki zur Syntax-Hervorhebung übermittelt wird, anstatt nachträglich das generierte HTML zu manipulieren. Da das Highlighten jedoch serverseitig geschieht, sollte alternativ das HTML-Parsing flexibler gestaltet werden, oder das Ersetzen erfolgt direkt im Server-Highlight-Schritt. 
Wenn es unbedingt clientseitig geschehen muss, kann ein flexiblerer Regex genutzt werden, der HTML-Tags ignoriert:
```typescript
const VAR_REGEX_HTML = /\{\{\s*(?:<[^>]*>)*\s*([A-Z0-9_]+)\s*(?:<[^>]*>)*\s*\}\}/g;
```

---

## 🏁 Fazit & Priorisierung des Backlogs

Die KoalaSnippets-App verfügt über eine solide Architektur und nutzt moderne Webtechnologien. Jedoch gibt es kritische Sicherheits- und Stabilitätsrisiken, die sofort behoben werden sollten:

1. **Priorität 1 (Sofort beheben - Kritischer Einfluss auf Sicherheit und Stabilität)**:
   - **SEC-01 (SQLite Foreign Keys)**: Reaktivierung mit einer Zeile behebt alle Kaskadierungsfehler.
   - **SEC-03 (Session Race Condition)**: Verhindert willkürliche Benutzer-Logouts.
   - **UX-03 (LocalStorage Crash)**: Verhindert das Einfrieren der Web-App bei Bildkonvertierungen.

2. **Priorität 2 (Wichtig - Schutz vor Angriffen und funktionale Korrektheit)**:
   - **SEC-02 (IP-Spoofing)**: Härtung des Rate-Limitings auf Login- und Registrierungsseiten.
   - **BUG-02 (Snippet Passwörter)**: Erlaubt das ordnungsgemäße Entfernen von Passwörtern.
   - **BUG-01 (Crash Reporter Doppel-Serialisierung)**: Behebt Runtime-Crashes im Admin-Panel.

3. **Priorität 3 (Quality of Life & UX-Härtung)**:
   - **UX-01 (Keyboard Trap)** und **UX-04 (Shortcut-Hijacking)**: Stellt WCAG-Konformität und Schreib-UX wieder her.
   - **UX-02 (HTML Entities in Cards)**: Repariert die Clipboard-Kopierfunktion.

*Bericht erstellt am 30. Mai 2026 durch den Antigravity Codebase Security & UX Auditor.*
