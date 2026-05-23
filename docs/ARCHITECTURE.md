# Architecture

## Overview

KoalaSnippets is a self-hosted snippet management application built with Next.js (App Router), featuring a clean two-pane interface with a responsive snippet grid, SQLite storage via Drizzle ORM, and server-side syntax highlighting with Shiki.

## Tech Stack

| Layer        | Technology                          |
|-------------|-------------------------------------|
| Framework   | Next.js 16+ (App Router, RSC)       |
| Language    | TypeScript (strict mode)            |
| Styling     | Tailwind CSS v4 + shadcn/ui components |
| Database    | SQLite via better-sqlite3           |
| ORM         | Drizzle ORM                         |
| Highlighting| Shiki (server-side, lazy loading)   |
| Auth        | Session/JWT + Argon2id + Pepper     |
| Icons       | lucide-react (bundled)              |
| Fonts       | next/font/google (zero layout shift, locally hosted) |

## Routing Strategy

### Page Routes (App Router)

```
/app
  /layout.tsx              # Root layout (fonts, CommandPalette mount, session state check)
  /page.tsx                # Public snippet explorer (PUBLIC visibility, responsive grid)
  /login/page.tsx          # Authentication page
  /register/page.tsx       # Registration (guarded by ALLOW_REGISTRATION)
  /snippets/
    /[id]/page.tsx         # Dedicated snippet detail view (full-width, back button)
  /dashboard/page.tsx      # User's private snippet management (responsive grid)
  /dashboard/new/page.tsx  # Create new snippet form (uses Custom CodeEditor)
  /settings/
    /page.tsx              # User settings (password change)
    /appearance/page.tsx   # Visual settings (App theme, list density, syntax highlights)
  /admin/page.tsx          # Admin dashboard (RBAC: ADMIN only)
  /stats/page.tsx          # Public statistics page
  /impressum/page.tsx      # German imprint (public)
  /privacy/page.tsx        # Privacy policy (public)
  /public/page.tsx         # Public explorer (redundant with /, kept for nav)
  /api/
    /auth/
      /login/route.ts      # POST: authenticate, set session cookie
      /logout/route.ts     # POST: destroy session
      /register/route.ts   # POST: create user (if ALLOW_REGISTRATION)
    /snippets/
      /route.ts            # GET: list/search with pagination, POST: create
      /[id]/route.ts       # GET/PUT/DELETE: single snippet operations
    /settings/
      /route.ts            # PUT: change password
      /appearance/route.ts # PUT: update visual settings and preferences JSON
    /health/
      /route.ts            # GET: server + database health check
    /admin/
      /users/route.ts      # GET: list all users, DELETE: remove user
      /backups/route.ts    # GET: list/download backups, POST: trigger backup
      /stats/route.ts      # GET: admin system metrics
    /public/
      /stats/route.ts      # GET: public statistics data
```

### Route Protection

- **Public routes:** `/`, `/login`, `/register`, `/impressum`, `/privacy`, `/stats`, `/api/auth/*`, `/api/health`, `/api/public/*`
- **Authenticated routes:** `/dashboard`, `/snippets/*`, `/api/snippets/*`, `/api/settings`, `/settings`, `/settings/appearance`, `/api/settings/appearance`
- **Admin-only routes:** `/admin`, `/api/admin/*` (returns 403 if session role is not `ADMIN`)
- **Token-protected routes:** `/snippets/[id]?token=xxx` (SHARED visibility)

## UI Layout Concept

### Two-Pane Layout (Desktop)

```
+----------+--------------------------------------------------+
| Sidebar  |  Main Content Area (full remaining width)        |
| (fixed)  |                                                  |
|          |  LIST VIEW (Home, Dashboard, Public):            |
| [Logo]   |  +--------------------------------------------+  |
| Nav      |  | [Sticky Search Bar + Include Code Toggle]  |  |
| Tags     |  +--------------------------------------------+  |
| Actions  |                                                  |
|          |  +-----------+ +-----------+ +-----------+      |
| Sign In  |  |  Card 1   | |  Card 2   | |  Card 3   |      |
| Settings |  +-----------+ +-----------+ +-----------+      |
|          |  +-----------+ +-----------+ +-----------+      |
| Legal    |  |  Card 4   | |  Card 5   | |  Card 6   |      |
| Links    |  +-----------+ +-----------+ +-----------+      |
+----------+--------------------------------------------------+

DETAIL VIEW (/snippets/[id]):
+----------+--------------------------------------------------+
| Sidebar  |  [Back to list]                                  |
|          |  +--------------------------------------------+  |
|          |  | Title | Visibility | Expiry | Actions      |  |
|          |  +--------------------------------------------+  |
|          |  | File Tabs: [File 1.ts] [File 2.css]        |  |
|          |  +--------------------------------------------+  |
|          |  |                                            |  |
|          |  |  Shiki-highlighted code block (full-width) |  |
|          |  |                                            |  |
|          |  +--------------------------------------------+  |
|          |  [Copy Code]  [Download]                       |  |
+----------+--------------------------------------------------+
```

### Responsive Behavior

- **Desktop (1024px+):** Sidebar visible, 3-column card grid (`lg:grid-cols-3`)
- **Tablet (768px-1024px):** Sidebar visible, 2-column card grid (`md:grid-cols-2`)
- **Mobile (< 768px):** Sidebar collapses to drawer, 1-column card grid

### Component & Domain Architecture (Restructured)

To support logical scalability and maintainability, the project implements a clean, domain-driven directory structure under `src/features/`.

```
src/
  features/
    admin/                 # Administrative tools and safeguards
      components/          # AdminMetrics, AdminUserList, AdminBackupList
      utils/               # AdminGuards, Backup processes and interval schedulers
    auth/                  # Authentication forms and cryptographic wrappers
      components/          # LoginForm, RegisterForm, PasswordChangeForm
      utils/               # Session storage handles, Argon2 hashing & pepper seeding
    snippets/              # Snippet operations and UI
      components/          # SnippetCard, SnippetSearchHeader, Custom CodeEditor
      utils/               # Keyboard shortcuts & lazy-loaded Shiki syntax highlight
    core/                  # Domain-independent structure and layouts
      components/          # Global Sidebar, DetailView, glassmorphic CommandPalette, AppearanceSettingsForm
      utils/               # Tailwind style merges, validations, seed metrics, rate limiters
  components/
    ui/                    # shadcn/ui base primitive layouts (buttons, inputs, cards, toasts)
```

## Search Architecture

### Server-Side Search (FTS-style)

Search is performed server-side via Drizzle parameterized `LIKE` queries. The `SnippetSearchHeader` client component debounces input (300ms) and updates URL search params (`?q=...&includeCode=...`), triggering a server re-render.

| Toggle Off | Searches: `title`, `language`, `tags` |
| Toggle On  | Also searches: `code` field |

All queries use Drizzle's parameterized operators — no string concatenation with user input.

### Global `CommandPalette` Search HUD (`Ctrl+K`)
In addition to the sticky search header, users can trigger a premium floating command palette HUD (`Ctrl+K` or `⌘K`). It queries the `/api/snippets?q=...` API endpoint on-demand with debounced triggers, and enables keyboard navigation (`ArrowUp`/`ArrowDown`/`Enter`) alongside direct slash-commands (`/new`, `/settings`, `/backups`, `/home`, `/dashboard`). The API endpoint supports `?includeCode=true` for searching within code content.

### Rate Limiting

In-memory `Map`-based rate limiter (`src/features/core/utils/rate-limit.ts`):
- Login: 5 attempts per 15 minutes per IP
- Registration: 3 attempts per 60 minutes per IP
- Auto-cleanup every 5 minutes
- Zero external dependencies (no Redis)

## Database Design

### Schema (Drizzle ORM + SQLite)

```sql
-- Users table
users (
  id              TEXT PRIMARY KEY,
  username        TEXT UNIQUE NOT NULL,
  password_hash   TEXT NOT NULL,          -- Argon2id hash
  role            TEXT NOT NULL DEFAULT 'USER',
  preferences     TEXT NOT NULL,          -- JSON object
  created_at      INTEGER NOT NULL
)

-- Snippets table (metadata)
snippets (
  id              TEXT PRIMARY KEY,
  title           TEXT NOT NULL,
  description     TEXT,
  tags            TEXT,                   -- JSON array
  author_id       TEXT NOT NULL REFERENCES users(id),
  visibility      TEXT NOT NULL DEFAULT 'PRIVATE',
  share_token     TEXT UNIQUE,
  is_pinned       INTEGER NOT NULL DEFAULT 0,
  expires_at      INTEGER,
  collection_id   TEXT REFERENCES collections(id),
  total_lines     INTEGER NOT NULL DEFAULT 0,
  password_hash   TEXT,
  created_at      INTEGER NOT NULL,
  updated_at      INTEGER NOT NULL
)

-- Snippet Files table (multi-file support)
snippet_files (
  id              TEXT PRIMARY KEY,
  snippet_id      TEXT NOT NULL REFERENCES snippets(id),
  filename        TEXT NOT NULL,
  code            TEXT NOT NULL,
  language        TEXT NOT NULL
)

-- Collections table
collections (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  user_id         TEXT NOT NULL REFERENCES users(id)
)

-- User Favorites table
user_favorites (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES users(id),
  snippet_id      TEXT NOT NULL REFERENCES snippets(id),
  created_at      INTEGER NOT NULL
)

-- Sessions table
sessions (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES users(id),
  token_hash      TEXT NOT NULL,
  expires_at      INTEGER NOT NULL,
  created_at      INTEGER NOT NULL
)

-- Site Settings
site_settings (
  id                    INTEGER PRIMARY KEY,
  registration_enabled  INTEGER NOT NULL DEFAULT 1,
  global_announcement   TEXT,
  max_snippets_per_user INTEGER NOT NULL DEFAULT 1000,
  max_chars_per_snippet INTEGER NOT NULL DEFAULT 250000
)

-- Site Statistics
site_statistics (
  id                      INTEGER PRIMARY KEY,
  total_users_created     INTEGER NOT NULL DEFAULT 0,
  total_snippets_created  INTEGER NOT NULL DEFAULT 0
)
```

### Indexes

- `snippets(author_id)` - Fast lookup of user's snippets
- `snippets(visibility)` - Fast filtering by visibility
- `snippets(share_token)` - Fast token lookup for shared links
- `sessions(token_hash)` - Fast session validation
- `sessions(user_id)` - Fast user session lookup

### SQLite Hardening (WAL Mode & Parameters)

To ensure the database is highly robust and performs well under parallel access, we configure the connection under `src/db/index.ts` with hardened settings:
- **Write-Ahead Logging (WAL):** `PRAGMA journal_mode = WAL` enables concurrent readers and writers without lock contention.
- **Normal Synchronization:** `PRAGMA synchronous = NORMAL` lowers flush overhead, optimizing disk write speed while maintaining corruption safety.
- **Busy Timeout:** `busy_timeout = 5000` tells better-sqlite3 to wait up to 5 seconds when database files are locked, completely avoiding immediate SQLITE_BUSY locking crashes.

### Visibility Logic

| Visibility | Who Can See | Listed? | Access Method |
|-----------|-------------|---------|---------------|
| PRIVATE   | Author only | Yes (dashboard grid) | Auth required |
| SHARED    | Anyone with link | No | Exact URL with token |
| PUBLIC    | Everyone | Yes (home grid) | Any access |

## Deployment Architecture

```
[Client Browser]
       |
       v
[Caddy Reverse Proxy]  <-- Security headers (CSP, HSTS, etc.)
       |
       v
[Next.js App (Node.js)]  <-- Docker container
       |
       v
[SQLite DB File]  <-- Persistent volume mount
```

### Docker Setup

- Multi-stage build: install deps -> build -> production image
- SQLite file persisted via Docker volume
- Environment variables for configuration
- Non-root user in container

### Font Strategy

All fonts use `next/font/google` (Inter, JetBrains Mono). Fonts are subsetted at build time, hosted locally inside the Next.js bundle, and served with zero layout shift. No external CSS or font CDNs.

## Backup Architecture

### Automated SQLite Backups

KoalaSnippets includes an automated internal backup system that runs on a 6-hour interval, tied to the server lifecycle via Next.js instrumentation hooks.

### Mechanism

- **VACUUM INTO:** Backups use the native SQLite `VACUUM INTO 'path/to/backup.db'` command via `better-sqlite3`. This guarantees a non-corrupt, defragmented copy of the live database.
- **Scheduler:** The backup scheduler starts automatically when the Next.js server boots (`src/instrumentation.ts`). It runs an initial backup immediately, then repeats every 6 hours.
- **Backup Directory:** Backups are stored in `/backups` (configurable via `BACKUP_DIR` env var, defaults to `./backups`).

### GFS Retention Strategy (Grandfather-Father-Son)

A rotation policy automatically prunes old backups to prevent disk bloat:

| Tier | Retention | Description |
|------|-----------|-------------|
| Daily (Son) | 7 days | 1 backup per day for the last 7 days |
| Weekly (Father) | 4 weeks | 1 backup per week for the last 4 weeks |
| Monthly (Grandfather) | 12 months | 1 backup per month for the last 12 months |

Backups older than these rules are automatically deleted during each backup cycle.

### Files

| File | Purpose |
|------|---------|
| `src/features/admin/utils/backup.ts` | Core backup logic: VACUUM INTO, GFS retention, date parsing |
| `src/features/admin/utils/backup-scheduler.ts` | Interval-based scheduler (6-hour cycle) |
| `src/instrumentation.ts` | Next.js server lifecycle hook to start scheduler |

### Health Check

A lightweight `GET /api/health` endpoint returns `{"status": "ok", "timestamp": "..."}` if both the Next.js server and the SQLite database are responsive. Returns `503` with `{"status": "error"}` if the database is unreachable.

## Power-User Features

### Premium Custom `CodeEditor`
In `src/features/snippets/components/code-editor.tsx`, a custom browser-native code editor is deployed to handle tab indentation and bracket auto-closing:
- **Tab capture:** Intercepts default key triggers to insert 2 clean spaces, avoiding losing control focus.
- **Bracket/Quote auto-close:** Autocompletes matching elements (`(`, `[`, `{`, `"`, `'`, `` ` ``) instantly while keeping the caret centered.
- **Overtyping skip:** Ignores repeated closing elements if the user types them manually right before the caret.
- **Backspace matching-pair deletion:** Hitting `Backspace` between matching brackets or quotes deletes both characters at once.

### Shiki Performance (Lazy-Loaded Languages & Highlighting Themes)
To keep memory usage minimal and server starts instantaneous, `src/features/snippets/utils/shiki.ts` is configured to lazy-load syntax parsing libraries. It loads only 5 core languages on boot, and dynamically executes `hl.loadLanguage(...)` if the user opens a snippet containing any of the other 31 supported languages.
Furthermore, syntax highlighting themes (e.g. `dracula`, `nord`, `poimandres`, `monokai`, `github-light`) are lazy-loaded dynamically on-demand, caching compiled highlighters dynamically and preventing bundle bloat.

### Visual Appearance Customization

Users can personalize their coding environment in real-time under `/settings/appearance`:
- **App Themes:** Toggle among Default Dark, Midnight Blue, Hacker Green, Light Mode, Nord, Dracula, and Terracotta with interactive live HSL overrides on the document tree.
- **Background Patterns:** Choose from four pure CSS background patterns (`flat`, `dots`, `grid`, `gradient`) scoped dynamically to both the global body and interactive client-side preview wrappers.
- **Snippet Densities:** Personalize layouts by selecting `compact` density (metadata list), `preview` density (Shiki highlighted 5-line truncated previews compiled on the server), or `full` density (complete highlighted code card).
- **Syntax Themes:** Instantly swap code themes with zero-latency client-side visualization mockups.

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd+K` / `Ctrl+K` | Launches and centers the search CommandPalette HUD |
| `Cmd+S` / `Ctrl+S` | Triggers form submission while editing/creating a snippet |

Shortcuts are implemented via a global `keydown` listener (`src/features/snippets/utils/keyboard-shortcuts.ts`) and are active on all pages.

### Download Code

A "Download" button next to "Copy Code" in the Snippet Detail view triggers a browser download of the raw code. The filename uses the snippet's title (sanitized) and the correct file extension based on the `language` field (e.g., `.py` for python, `.sql` for sql, `.ts` for typescript).

### OpenGraph Rich Previews

The `/snippets/[id]` page implements Next.js dynamic `generateMetadata`. When a SHARED or PUBLIC link is shared on platforms like Slack/Discord, it displays a preview card with:
- Snippet title, language, and tags
- Description (or fallback)
- `siteName: "KoalaSnippets"`

## Accessibility (A11y)

### Keyboard Navigation

- All interactive elements are reachable via `Tab` navigation.
- Icon-only buttons include descriptive `aria-label` attributes.
- The 2-pane interface supports full keyboard navigation.
- Error messages use `role="alert"` for screen reader announcements.

### Toast Notifications

A lightweight toast system (`src/components/ui/toast.tsx`) provides animated feedback for user actions:
- "Snippet saved!" on successful creation
- "Link copied!" on share link copy
- "Password changed!" on successful password update
- "Downloaded <filename>" on code download

Toasts auto-dismiss after 3 seconds and are positioned in the bottom-right corner. The toast container uses `aria-live="polite"` for screen reader compatibility.
