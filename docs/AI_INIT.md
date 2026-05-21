# AI Initialization Rules

## Core Directives for AI Agents

These rules MUST be followed by any AI agent working on this codebase.

### Zero-Bloat Policy
- **NO external CDNs.** Every asset, font, icon, and library must be locally bundled.
- Only install npm packages that are explicitly required for a feature.
- Avoid heavy meta-frameworks or utility libraries when a native solution exists.
- Prefer `fontsource/*` packages for fonts over Google Fonts CDN.
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

### Shiki Syntax Highlighting
- Shiki runs server-side only. No client-side highlighting.
- Use React Server Components to render highlighted code.
- Cache Shiki theme loading to avoid per-request filesystem reads.
- Supported themes: GitHub Dark (default), GitHub Light.

### Security Rules
- Passwords: Argon2id + per-user Salt + application-level Pepper (env var).
- Session tokens: cryptographically random, stored hashed in DB.
- All user input validated with Zod schemas before processing.
- HTTP security headers enforced (see `Caddyfile.example`).
- CSP must block all inline scripts except nonce-based, and all external origins.

### UI/UX Conventions
- Three-pane IDE-like layout (sidebar, list view, detail view).
- Dark mode by default, light mode toggle.
- All UI components built with shadcn/ui pattern (copy-paste, no heavy UI lib).
- Responsive: collapses to single-pane on mobile.

### File Organization
```
src/
  app/          # Next.js App Router pages & API routes
  components/   # React components (server & client)
  db/           # Drizzle schema, migrations, connection
  lib/          # Utilities (auth, shiki, validation)
  styles/       # Global CSS, Tailwind config
```

### Git Conventions
- Conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`
- No secrets in commits. Ever.
- `.env` files are gitignored. `.env.example` is provided.
