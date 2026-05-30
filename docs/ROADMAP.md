# 🗺️ KoalaSnippets Roadmap

Diese Datei dient als zentrale Planungsdokumentation für neue Features.

> **Wichtig:** Abgeschlossene Features müssen nach Deployment umgehend aus dieser Datei entfernt werden. Das ROADMAP.md soll nur offene, nicht umgesetzte Punkte enthalten.

## Format für neue Feature Requests

Jedes neue Feature soll nach folgendem Schema dokumentiert werden:

```markdown
### 🏷️ Phase X: <Thema>
*<Ein-Satz-Beschreibung der Phase>*

#### 1. <Feature-Name>
- **Description**: <Was soll das Feature tun? Welches Problem löst es?>
- **Implementation**:
  - <Konkreter Schritt 1 mit Dateipfad>
  - <Konkreter Schritt 2 mit Dateipfad>
  - <Konkreter Schritt 3 mit Dateipfad>
- **Estimated Effort**: ~XXX lines of code.
```

**Regeln:**
- Jede Phase hat ein klares Thema (z.B. "Quick Fixes", "UI/UX", "Security")
- Jedes Feature beschreibt WAS es tut, WIE es implementiert wird und WIEVIEL Aufwand es kostet
- Dateipfade müssen konkret sein (`src/features/...`, `src/app/...`)
- Geschätzte LOC beziehen sich auf die reine Code-Änderung (ohne Tests/Kommentare)
- **Nach Fertigstellung:** Feature aus dieser Datei entfernen, nicht als "erledigt" markieren

---

### 🏷️ Phase 1: Security & Integrity Fixes
*Behebung kritischer Sicherheitslücken, Härtung des Session-Managements und Wiederherstellung der Fremdschlüssel-Validierung.*

#### 1. Automatische Fremdschlüssel-Aktivierung [SEC-01]
- **Description**: Reaktiviert die referentielle Integrität im Produktivbetrieb (für kaskadierendes Löschen von sessions, collections, favorites), ohne Docker-Container-Seeding/Migrationen zu beeinträchtigen.
- **Implementation**:
  - `src/db/index.ts`: Verbindung standardmäßig mit `foreign_keys = OFF` initialisieren.
  - `src/instrumentation.ts`: Am Ende von `register()` nach allen Migrations- und Seed-Aktivitäten `PRAGMA foreign_keys = ON;` ausführen.
- **Estimated Effort**: ~6 lines of code.

#### 2. Schutz vor IP-Header-Spoofing im Rate-Limiting [SEC-02]
- **Description**: Verhindert das Umgehen von Rate-Limits auf Login-, Registrierungs- und Passwort-Unlock-Seiten durch fiktive IP-Adressen in `X-Forwarded-For`.
- **Implementation**:
  - `src/app/api/auth/register/route.ts`: IP über `x-real-ip` oder das letzte Element von `x-forwarded-for` ermitteln.
  - `src/app/api/auth/login/route.ts`: IP sicher ermitteln.
  - `src/app/api/snippets/[id]/unlock/route.ts`: IP sicher ermitteln.
- **Estimated Effort**: ~15 lines of code.

#### 3. Graceful Session Token Refresh [SEC-03]
- **Description**: Beseitigt sporadische Logouts bei parallelen API-Anfragen im Refresh-Fenster, indem die Expiration verlängert statt das Token neu generiert und gelöscht wird.
- **Implementation**:
  - `src/features/auth/utils/session.ts`: In `_getSession` bei ablaufenden Sessions nur `expiresAt` im bestehenden Eintrag verlängern, anstatt den alten Eintrag zu löschen und neu einzufügen.
- **Estimated Effort**: ~10 lines of code.

---

### 🏷️ Phase 2: Logic & Developer QoL Bugs
*Korrektur fehlerhafter Daten-Serialisierung, Behebung von HMR-Memory-Leaks und funktionale Korrekturen.*

#### 1. JSON-Serialisierung im Crash-Reporter [BUG-01]
- **Description**: Behebt die Doppel-Serialisierung von Metadaten und nachfolgende Anzeigefehler im Admin-Panel.
- **Implementation**:
  - `src/features/core/utils/crash-reporter.ts`: Metadaten-Objekt direkt übergeben anstatt `JSON.stringify` manuell aufzurufen.
- **Estimated Effort**: ~2 lines of code.

#### 2. Aufhebung des Passwortschutzes [BUG-02]
- **Description**: Ermöglicht Benutzern das Entfernen des Passwortschutzes bei Snippets durch explizite Null-Wert-Prüfung in der PUT-Route.
- **Implementation**:
  - `src/app/api/snippets/[id]/route.ts`: Prüfen, ob `password` im Payload als leerer String/Null übergeben wurde, und `passwordHash` in der DB löschen.
- **Estimated Effort**: ~6 lines of code.

#### 3. Beseitigung von HMR-Listener Memory Leaks [BUG-03]
- **Description**: Verhindert Speicherlecks in der Entwicklung durch unbereinigtes Registrieren von `process`-Event-Listenern.
- **Implementation**:
  - `src/features/core/utils/file-logger.ts`: Registrierung über ein globales Flag absichern, sodass sie nur einmal pro NodeJS-Laufzeit ausgeführt wird.
- **Estimated Effort**: ~8 lines of code.

#### 4. HMR Scheduler-Doppelung verhindern [BUG-04]
- **Description**: Verhindert, dass nach HMR-Reloads mehrere Timer parallel im Hintergrund Backups und Wartungstasks ausführen.
- **Implementation**:
  - `src/features/admin/utils/backup-scheduler.ts`: Interval-Timer-Instanz im `globalThis`-Scope speichern.
  - `src/features/admin/utils/db-maintenance-scheduler.ts`: Interval-Timer-Instanz im `globalThis`-Scope speichern.
- **Estimated Effort**: ~16 lines of code.

---

### 🏷️ Phase 3: UI/UX & A11y Polish
*Behebung von Barrierefreiheits-Mängeln, Copy-Fehlern und UI-Bugs.*

#### 1. Keyboard Trap im Keycode-Tool auflösen [UX-01]
- **Description**: Ermöglicht Tastatur-Nutzern das Deaktivieren des Tools und das Navigieren über die Tastatur.
- **Implementation**:
  - `src/features/tools/components/keycode-tool.tsx`: `Escape`-Taste zulassen, um Erfassung zu beenden, und Standard-Browsertasten (z.B. F-Tasten) nicht blockieren.
- **Estimated Effort**: ~5 lines of code.

#### 2. HTML-Entities-Leak beim Kopieren [UX-02]
- **Description**: Behebt verfälschten Code (wie `&lt;` statt `<`) in der Dashboard-Card-Kopierfunktion.
- **Implementation**:
  - `src/features/snippets/components/snippet-card.tsx`: Verwendung eines temporären DOM-Elements zur Decodierung von Shiki-HTML vor dem Kopieren.
- **Estimated Effort**: ~5 lines of code.

#### 3. LocalStorage-Limit-Absturz im Image-Converter [UX-03]
- **Description**: Verhindert `QuotaExceededError`-Abstürze bei größeren Bilddateien durch Vermeidung von LocalStorage für Mediendaten.
- **Implementation**:
  - `src/features/tools/components/image-converter-tool.tsx`: Speicherung in einfachem React `useState` anstelle von LocalStorage.
- **Estimated Effort**: ~3 lines of code.

#### 4. Shortcut Input Hijack verhindern [UX-04]
- **Description**: Verhindert, dass globale Shortcuts ausgelöst werden, während der Benutzer in Editoren oder Textfeldern schreibt.
- **Implementation**:
  - `src/features/snippets/utils/keyboard-shortcuts.ts`: Konsequente `isInput`-Prüfung vor dem Auslösen von `Ctrl+K` und `Ctrl+Shift+N`.
- **Estimated Effort**: ~2 lines of code.

#### 5. Behebung der .env-Ersetzung in Detailansicht [UX-05]
- **Description**: Ermöglicht das korrekte Ersetzen von Platzhaltern im Syntax-hervorgehobenen Code, die durch Shiki tokenisiert wurden.
- **Implementation**:
  - `src/features/core/components/detail-view.tsx`: Regex anpassen, sodass dazwischenliegende HTML-Tags ignoriert werden.
- **Estimated Effort**: ~10 lines of code.



