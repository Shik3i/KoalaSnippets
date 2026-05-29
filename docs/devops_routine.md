# 🛠️ KoalaSnippets DevOps Routine

This document outlines the standard operating procedures (SOP) that any Agent or Developer must strictly follow before committing and pushing code to the repository. The goal is to ensure the `main` branch remains stable and that no broken code is deployed.

## 1. Pre-Commit Quality Checks
Before creating any commit, you must verify that the codebase is clean and builds successfully. 

### A. Linter Check
Always run the linter to catch syntax errors, unused variables, and styling issues:
```bash
npm run lint
```
**Action**: If the linter fails, **FIX THE ERRORS** before proceeding. Do not ignore linter warnings unless strictly necessary and documented.

### B. Production Build Check (MANDATORY — EVERY PUSH)
The most critical step is ensuring the Next.js application can build for production without errors. Next.js does strict TypeScript checking during the build. **This catches errors that `npm run typecheck` alone may miss** (e.g., missing module declarations when `.next` doesn't exist).
```bash
rm -rf .next && npm run build
```
*(Note: `AUTH_PEPPER` is required by the environment validation during build. Set it if not in `.env`.)*

**Action**: **READ THE BUILD OUTPUT!**
- If the build fails (e.g., TypeScript errors, missing modules, conflicting types), **DO NOT PUSH**. Fix the errors and rebuild.
- *Known Exception*: The Turbopack warning `Encountered unexpected file in NFT list` regarding `next.config.ts` is a known Next.js upstream issue and can be safely ignored as long as the build succeeds (`✓ Compiled successfully`).

### C. Clean-Slate Build Check (CRITICAL — MANDATORY)
Der reguläre `npm run build` läuft in deiner Dev-Umgebung mit existierender SQLite-DB und `.env`-Datei. In der Docker-Produktionsumgebung existieren diese **nicht** — Next.js crasht dann beim `generateStaticParams()` oder anderen Build-Time-DB-Zugriffen.

**Dieser Check simuliert die Docker-Build-Umgebung und MUSS vor jedem Push bestanden werden:**

```powershell
# Windows PowerShell
Remove-Item -Recurse -Force data -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run build
```

```bash
# Linux/macOS
rm -rf data .next
npm run build
```

**Wenn dieser Build fehlschlägt: NICHT PUSHEN.** Der Docker-Build auf GitHub Actions wird garantiert crashen. Häufige Fehlerursachen:

- `generateStaticParams()` greift zur Build-Zeit auf SQLite zu → mit `try/catch` wrappen
- Page-Komponente führt DB-Query aus statt `force-dynamic` zu nutzen
- `data/` oder `backups/` Verzeichnis wird erwartet aber ist nicht im Dockerfile angelegt

## 2. Commit & Push Guidelines
- **Granular Commits**: Use conventional commits (`feat:`, `fix:`, `refactor:`, `docs:`).
- **Atomic Changes**: Commit logical chunks of work together.
- **Pushing**: Only push when Phase/Task is complete AND the build check has passed.

## 3. Releasing and Tagging
- **NEVER** create or push a new Git tag (release) automatically unless explicitly instructed by the user.
- When instructed to release a new version:
  1. Bump the version in `package.json` (e.g., `npm --no-git-tag-version version patch`).
  2. Commit the version bump.
  3. Create the tag: `git tag v1.x.x`.
  4. Push both the commit and the tag: `git push && git push origin v1.x.x`.

## 4. Database Migrations
- If you modified the database schema (`src/db/schema.ts`), you **must** generate migrations:
  ```bash
  npm run db:generate
  ```
- **Deployment**: Migrations are automatically applied on the production server via `src/instrumentation.ts` when the Next.js server starts. No manual `db:migrate` is required on the server.

### ⚠️ CRITICAL: Migration Safety (READ BEFORE GENERATING)
Drizzle wraps migrations in SQL transactions. In SQLite, `PRAGMA foreign_keys=OFF` is a **NO-OP inside transactions**. This caused production data loss (snippets cascade-deleted on every startup).

**MANDATORY RULES:**
1. **NEVER use `DROP TABLE` in a migration** — Drizzle's `migrate()` runs inside a transaction, so `PRAGMA foreign_keys=OFF` won't prevent cascade deletes
2. **NEVER recreate tables** (CREATE new → INSERT → DROP old → RENAME) — same transaction/pragma issue
3. **If `drizzle-kit generate` produces `DROP TABLE`**: Open the SQL file and MANUALLY remove it. Keep only additive operations (CREATE INDEX, ALTER TABLE ADD COLUMN, etc.)
4. **Test every migration locally** before committing:
   ```bash
   rm -rf data .next && npm run build && npm run start
   # Then verify: docker exec koalasnippets node -e "..." or check logs
   ```
5. **Never trust `drizzle-kit generate` blindly** — it may detect false "schema drift" and generate unnecessary table recreations that destroy data

---
**Agent Reminder**: Always follow this routine implicitly. Your core directive is to maintain a stable, production-ready codebase.
