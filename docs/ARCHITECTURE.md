# Architecture

## Overview

KoalaSnippets is a self-hosted snippet management application built with Next.js (App Router), featuring a modern three-pane IDE-like interface, SQLite storage via Drizzle ORM, and server-side syntax highlighting with Shiki.

## Tech Stack

| Layer        | Technology                          |
|-------------|-------------------------------------|
| Framework   | Next.js 15+ (App Router, RSC)       |
| Language    | TypeScript (strict mode)            |
| Styling     | Tailwind CSS + shadcn/ui components |
| Database    | SQLite via better-sqlite3           |
| ORM         | Drizzle ORM                         |
| Highlighting| Shiki (server-side)                 |
| Auth        | Session/JWT + Argon2id + Pepper     |
| Icons       | lucide-react (bundled)              |
| Fonts       | @fontsource/* (bundled)             |

## Routing Strategy

### Page Routes (App Router)

```
/app
  /layout.tsx              # Root layout (fonts, providers, security)
  /page.tsx                # Public snippet explorer (PUBLIC visibility only)
  /login/page.tsx          # Authentication page
  /register/page.tsx       # Registration (guarded by ALLOW_REGISTRATION)
  /snippets/
    /[id]/page.tsx         # Snippet detail view (auth + visibility check)
  /dashboard/page.tsx      # User's private snippet management
  /api/
    /auth/
      /login/route.ts      # POST: authenticate, set session cookie
      /logout/route.ts     # POST: destroy session
      /register/route.ts   # POST: create user (if ALLOW_REGISTRATION)
    /snippets/
      /route.ts            # GET: list snippets, POST: create snippet
      /[id]/route.ts       # GET/PUT/DELETE: single snippet operations
    /share/
      /[id]/route.ts       # GET: validate share token, return snippet
```

### Route Protection

- **Public routes:** `/`, `/login`, `/register`, `/api/auth/*`
- **Authenticated routes:** `/dashboard`, `/snippets/*`, `/api/snippets/*`
- **Token-protected routes:** `/snippets/[id]?token=xxx` (SHARED visibility)

## UI Layout Concept

### Three-Pane Layout (Desktop)

```
+------------------+---------------------------+----------------------------------+
|   LEFT SIDEBAR   |     MIDDLE LIST VIEW      |       MAIN DETAIL VIEW           |
|   (240px fixed)  |     (320px flexible)      |       (remaining width)          |
|                  |                           |                                  |
| [Koala Logo]     | [Search Bar]              | [Title] [Edit] [Delete] [Share]  |
| KoalaSnippets    | [Toggle: Include code]    | [Description]                    |
|                  |                           |                                  |
| Navigation:      | Scrollable list:          | +-------------------------------+|
| - Home           | - Snippet Card            | |                               ||
| - My Snippets    |   - Title                 | |   Shiki-highlighted code      ||
| - Public Explorer|   - Language badge        | |   block                       ||
|                  |   - Tags                  | |                               ||
| Tags/Languages:  |   - Date                  | +-------------------------------+|
| - JavaScript     |   - Visibility icon       | [Copy Code] button (top-right)   |
| - Python         |                           |                                  |
| - TypeScript     |                           |                                  |
| - ...            |                           |                                  |
|                  |                           |                                  |
| [+ New Snippet]  |                           |                                  |
+------------------+---------------------------+----------------------------------+
```

### Responsive Behavior

- **Tablet (768px-1024px):** Sidebar collapses to icons. List + Detail panes visible.
- **Mobile (< 768px):** Single pane. Navigation via drawer. List or Detail view toggled.

### Component Architecture

```
src/components/
  layout/
    sidebar.tsx          # Left sidebar with nav, tags, new button
    list-view.tsx        # Middle pane: search + snippet list
    detail-view.tsx      # Right pane: snippet detail + code block
  ui/                    # shadcn/ui primitives (button, input, badge, etc.)
  snippets/
    snippet-card.tsx     # Card in list view
    code-block.tsx       # Server component: Shiki rendering
    visibility-badge.tsx # PUBLIC/SHARED/PRIVATE indicator
    share-dialog.tsx     # Copy share URL dialog
  auth/
    login-form.tsx
    register-form.tsx
```

## Database Design

### Schema (Drizzle ORM + SQLite)

```sql
-- Users table
users (
  id              TEXT PRIMARY KEY (UUID v4),
  username        TEXT UNIQUE NOT NULL,
  password_hash   TEXT NOT NULL,          -- Argon2id hash
  created_at      INTEGER NOT NULL        -- Unix timestamp
)

-- Snippets table
snippets (
  id              TEXT PRIMARY KEY (UUID v4),
  title           TEXT NOT NULL,
  description     TEXT,
  code            TEXT NOT NULL,
  language        TEXT NOT NULL,          -- e.g., "typescript", "python"
  tags            TEXT,                   -- JSON array: ["react", "hooks"]
  author_id       TEXT NOT NULL REFERENCES users(id),
  visibility      TEXT NOT NULL DEFAULT 'PRIVATE',  -- ENUM: PRIVATE, SHARED, PUBLIC
  share_token     TEXT UNIQUE,            -- NULL when not SHARED
  created_at      INTEGER NOT NULL,
  updated_at      INTEGER NOT NULL
)

-- Sessions table
sessions (
  id              TEXT PRIMARY KEY (UUID v4),
  user_id         TEXT NOT NULL REFERENCES users(id),
  token_hash      TEXT NOT NULL,          -- Hashed session token
  expires_at      INTEGER NOT NULL,
  created_at      INTEGER NOT NULL
)
```

### Indexes

- `snippets(author_id)` - Fast lookup of user's snippets
- `snippets(visibility)` - Fast filtering by visibility
- `snippets(share_token)` - Fast token lookup for shared links
- `sessions(token_hash)` - Fast session validation
- `sessions(user_id)` - Fast user session lookup

### Visibility Logic

| Visibility | Who Can See | Listed? | Access Method |
|-----------|-------------|---------|---------------|
| PRIVATE   | Author only | Yes (in dashboard) | Auth required |
| SHARED    | Anyone with link | No | Exact URL with token |
| PUBLIC    | Everyone | Yes (public explorer) | Any access |

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
