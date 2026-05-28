# AI Initialization Rules

## Core Directives for AI Agents

These rules MUST be followed by any AI agent working on this codebase.

### Zero-Bloat Policy
- **NO external CDNs.** Every asset, font, icon, and library must be locally bundled.
- Only install npm packages that are explicitly required for a feature.
- Avoid heavy meta-frameworks or utility libraries when a native solution exists.
- Use `next/font/google` for fonts (Inter, JetBrains Mono). Subsetted at build time, zero layout shift.
- Use `lucide-react` for icons (bundled, no CDN).

### TypeScript Strictness
- All code must be written in strict TypeScript.
- No `any` types unless absolutely unavoidable (with a comment explaining why).
- Use `unknown` over `any` when type is truly unknown.
- Enable `strict: true` in `tsconfig.json`.
- All function parameters and return types must be explicitly typed.

### Drizzle ORM Rules
- All database queries MUST use Drizzle ORM parameterized queries.
- Never write raw SQL strings that concatenate user input.
- Use Drizzle's type-safe query builder exclusively.
- Schema changes go through Drizzle migrations only (`drizzle-kit generate`).
- The SQLite database file location is defined by `DATABASE_URL` env var.

### Shiki Syntax Highlighting (Lazy-Loaded)
- Shiki runs server-side only. No client-side highlighting.
- Use React Server Components or secure API routes to fetch/render highlighted code.
- Supported themes: GitHub Dark (default), GitHub Light.
- **Language Lazy-Loading:** Shiki is initialized with a minimal set of core languages. Other languages are loaded dynamically on demand using `await hl.loadLanguage(...)` to keep memory minimal.

### Security Rules
- Passwords: Argon2id + per-user Salt + application-level Pepper (env var).
- Session tokens: cryptographically random, stored hashed in DB.
- All user input validated with Zod schemas before processing.
- HTTP security headers enforced (see `next.config.ts` and `Caddyfile.example`).
- CSP must block all external origins. Dev mode relaxes for fast-refresh.
- `shareToken` comparison must use `crypto.timingSafeEqual`.

### UI/UX Conventions
- **Two-pane layout:** Fixed sidebar + full-width main content area.
- **List views:** Responsive card grid (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`).
- **Detail views:** Dedicated route (`/snippets/[id]`) with full-width display and "Back to list" button.
- Dark mode by default.
- All UI components built with shadcn/ui pattern (copy-paste, no heavy UI lib).
- Responsive: sidebar collapses to drawer on mobile.
- **Command Palette (`Ctrl+K`):** Global frosted-glass search palette for snippets and slash navigations.
- **Code Editor:** Zero-dependency native editor for code input (`CodeEditor`) supporting Tab capture, bracket auto-close, and pair matching deletion.

### i18n Conventions
- All user-facing strings MUST use the `useI18n()` hook from `@/features/core/i18n`.
- New translation keys go in `src/features/core/i18n/types.ts` (the `Translations` interface), then added to both `locales/en.ts` and `locales/de.ts`.
- Do NOT hardcode English/German strings in JSX — use `{t.someKey}` instead.
- When adding a new key, update `tests/unit/i18n.test.ts` with the key in `ALL_KEYS`.
- The `I18nProvider` wraps the entire app in `src/app/layout.tsx`. Always test with both languages.
- Adding a new language: create `locales/xx.ts` satisfying the `Translations` type, add to `SUPPORTED_LOCALES` and `LOCALE_LABELS` in `types.ts`.

### File Organization (Feature-Driven)
The codebase uses a domain-driven layout for high modularity:
```
src/
  app/          # Next.js App Router pages & API routes
  features/     # Module-specific directories
    admin/      # administrative controls, metrics, database backup and scheduler processes
    auth/       # sign-in, registers, passwords and Argon2 crypt utilities
    snippets/   # code list cards, search filters, custom editor UI & Shiki syntax highlighter
    core/       # sidebars, details, command palette overlays, i18n, utility libraries & global CSS styles
  components/
    ui/         # shadcn/ui primitives + toasts
  db/           # Drizzle schema, migrations, connection
```

### File Size Limit
- Soft limit of **1,000 lines per file**.
- If a file grows too large, modularize into smaller components or helper functions.

### Git Conventions
- Conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`
- No secrets in commits. Ever.
- `.env` files are gitignored. `.env.example` is provided.

### Release & Tag Policy (CRITICAL)
- **NEVER bump `package.json` version or push a `git tag` without the user explicitly requesting it.**
- Documentation-only changes (`.md` files) do not require a new version or tag — just commit and push.
- A tag triggers a full GitHub Actions Docker build. Wasting CI/CD resources on cosmetic changes is unacceptable.
- Before any tag, confirm with the user: "Ready for a new release tag?"
