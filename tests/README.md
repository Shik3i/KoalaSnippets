# KoalaSnippets Test Suite

## Overview

This directory contains the complete automated test suite for KoalaSnippets.  
Tests run via Node.js native test runner (`node --test`) with TypeScript support via `tsx`.

```bash
npm test
```

**Important:** `npm test` transpiles TypeScript but does NOT type-check it. Use `npm run typecheck` (or `npm run validate` for all checks) to catch TypeScript errors.

## Full Quality Pipeline

```bash
npm run validate   # lint + typecheck + test (all must pass)
npm run build      # production build (catches additional build-time errors)
```

## Directory Structure

```
tests/
  README.md                       # This file
  auth.test.ts                    # Argon2 password hashing & verification
  backup-regex.test.ts            # GFS backup filename date parsing
  etag.test.ts                    # HTTP ETag generation & conditional caching
  path-traversal.test.ts          # Path traversal vulnerability detection

  unit/                           # Isolated unit tests (no DB/server needed)
    api-keys.test.ts              # API token generation, hashing, timing-safe comparison
    importer-security.test.ts     # SSRF protection, URL validation, filename sanitization
    tools.test.ts                 # Base64, hash, JWT decode, QR encoding utilities
    validations.test.ts           # Zod schemas, input validation boundaries

  integration/                    # API handler & workflow tests
    api-security.test.ts          # Auth guards, CSRF, rate limiting, visibility enforcement

  cli/                            # CLI script tests
    koala.test.ts                 # Argument parsing, command routing, output validation

  security/                       # Security-focused tests
    sql-injection.test.ts         # SQL injection vectors, XSS patterns, input escaping
```

## Adding New Tests

When you implement a new feature, add corresponding tests following these rules:

1. **Unit tests** go in `tests/unit/` — test pure functions in isolation
2. **Integration tests** go in `tests/integration/` — test API handlers with mock requests
3. **CLI tests** go in `tests/cli/` — test CLI command behavior
4. **Security tests** go in `tests/security/` — test against known attack vectors

### Naming Convention

Files must match `**/*.test.ts` to be discovered by the test runner.

### Test Structure

```typescript
import { describe, it } from "node:test";
import assert from "node:assert";

describe("FeatureName", () => {
  it("should behave correctly in normal case", () => {
    const result = myFunction("input");
    assert.strictEqual(result, "expected");
  });

  it("should handle edge case gracefully", () => {
    assert.throws(() => myFunction(null));
  });
});
```

### What to Test

- **Happy paths** — expected inputs produce expected outputs
- **Edge cases** — empty strings, null, undefined, very long inputs, special characters
- **Security boundaries** — injection attempts, path traversal, auth bypasses
- **Error handling** — invalid inputs produce meaningful errors, not crashes

## Running Specific Tests

```bash
# Run all tests
npm test

# Run a specific test file
npx tsx tests/unit/tools.test.ts

# Run with Node.js test runner filter
node --test --test-name-pattern="SQL" --import tsx tests/**/*.test.ts
```

## Pre-Push Production Checklist

KoalaSnippets läuft in Produktion als Docker-Container. Ein lokaler Build mit `npm run build` reicht **nicht** aus — der Build muss auch in einer sauberen Docker-Umgebung funktionieren.

### Warum lokaler Build nicht genügt

| Was | Lokal (Dev) | Docker Builder | Risiko |
|-----|------------|----------------|--------|
| SQLite-DB | Existiert unter `./data/` | **Nicht vorhanden** | `generateStaticParams()` und andere Build-Time-DB-Zugriffe crashen |
| `.env` | Vorhanden | **Nicht vorhanden** | `process.env.*`-Abhängigkeiten crashen |
| `node_modules` | Existiert | Frischer `npm install` | Lockfile-Konflikte |
| Verzeichnisse | `data/`, `backups/` existieren | **Nicht vorhanden** | DB-Connection crasht wenn Zielverzeichnis fehlt |

### Checkliste: Vor jedem Push und Tag

```bash
# 1. Statische Analyse & Tests
npm run lint          # Darf 0 Fehler haben
npm test              # Alle 182+ Tests müssen grün sein

# 2. Lokaler Build (muss sauber sein)
npm run build

# 3. ⚠️ CLEAN-SLATE BUILD (simuliert Docker-Umgebung)
#    Datenverzeichnis löschen, dann Build — DARF NICHT CRASHEN:
Remove-Item -Recurse -Force data -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run build
#    Wenn dieser Build fehlschlägt: NICHT PUSHEN. Fixen!

# 4. Docker-Build simulieren (optional aber empfohlen)
docker build --target builder .
```

### Häufige Build-Time-Fehler und ihre Ursachen

| Fehler | Ursache | Fix |
|--------|---------|-----|
| `Cannot open database because the directory does not exist` | `generateStaticParams()` oder Page-Komponente greift zur Build-Zeit auf SQLite zu | Mit `try/catch` wrappen oder `force-dynamic` setzen |
| `The directory does not exist` | Code erwartet dass `data/` existiert | Dockerfile: `RUN mkdir -p /app/data` im Builder-Stage |
| `process.env.X is undefined` | Env-Variable nur in `.env`, nicht im Dockerfile gesetzt | Dockerfile-Builder: `ENV VAR="dummy"` setzen |

### Was bei neuen Features zu testen ist

Wenn du eine neue Page oder API-Route erstellst:

- [ ] Funktioniert sie mit **existierender** DB?
- [ ] Funktioniert sie **ohne** DB? (Docker-Build-sicher)
- [ ] Hat jede API-Route mit DB-Zugriff `export const dynamic = "force-dynamic"`?
- [ ] Wird `generateStaticParams()` mit `try/catch` geschützt?
- [ ] Existieren benötigte Verzeichnisse (`data/`, `backups/`) im Dockerfile-Builder-Stage?
