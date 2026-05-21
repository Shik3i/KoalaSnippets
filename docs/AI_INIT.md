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

### Shiki Syntax Highlighting
- Shiki runs server-side only. No client-side highlighting.
- Use React Server Components to render highlighted code.
- Cache Shiki theme loading to avoid per-request filesystem reads.
- Supported themes: GitHub Dark (default), GitHub Light.

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

### File Organization
```
src/
  app/          # Next.js App Router pages & API routes
  components/   # React components (server & client)
    layout/     # Sidebar, detail view
    snippets/   # SnippetCard, SnippetSearchHeader
    ui/         # shadcn/ui primitives
    auth/       # Login/register forms
    settings/   # Password change form
  db/           # Drizzle schema, migrations, connection
  lib/          # Utilities (auth, session, shiki, rate-limit, validations)
```

### File Size Limit
- Soft limit of **1,000 lines per file**.
- If a file grows too large, modularize into smaller components or helper functions.

### Git Conventions
- Conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`
- No secrets in commits. Ever.
- `.env` files are gitignored. `.env.example` is provided.
