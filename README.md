# KoalaSnippets

A self-hosted, privacy-first snippet management web application with a modern IDE-like interface.

## Features

- **Three-pane IDE layout** - Sidebar navigation, snippet list, and code detail view
- **Server-side syntax highlighting** - Shiki renders highlighted code on the server (no heavy client scripts)
- **Three-tier visibility** - Private, Shared (link-only), and Public snippets
- **Zero external dependencies** - All fonts, icons, and assets bundled locally
- **Secure authentication** - Argon2id + Salt + Pepper password hashing
- **SQLite storage** - Lightweight, file-based database via Drizzle ORM
- **Dark/Light mode** - Respects system preference with manual toggle

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15+ (App Router, React Server Components) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS + shadcn/ui |
| Database | SQLite (better-sqlite3) |
| ORM | Drizzle ORM |
| Syntax Highlighting | Shiki (server-side) |
| Authentication | Session cookies + Argon2id + Pepper |

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm (recommended) or npm

### Development

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your values (especially AUTH_PEPPER and SESSION_SECRET)

# Generate database
pnpm db:generate
pnpm db:migrate

# Run development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production (Docker)

```bash
# Build and run with Docker Compose
docker compose up -d

# Or build manually
docker build -t koalasnippets .
docker run -d -p 3000:3000 -v koalasnippets-data:/app/data koalasnippets
```

## Configuration

See `.env.example` for all available environment variables.

| Variable | Description | Default |
|----------|-------------|---------|
| `AUTH_PEPPER` | Application-level password pepper (REQUIRED) | - |
| `SESSION_SECRET` | Session encryption secret (REQUIRED) | - |
| `DATABASE_URL` | SQLite file path | `file:./data/knalasnippets.db` |
| `ALLOW_REGISTRATION` | Enable/disable user registration | `false` |
| `NODE_ENV` | Environment | `development` |

## Project Structure

```
KoalaSnippets/
├── docs/                   # Architecture & AI documentation
├── src/
│   ├── app/                # Next.js App Router (pages, API routes)
│   ├── components/         # React components
│   │   ├── layout/         # Sidebar, list view, detail view
│   │   ├── ui/             # shadcn/ui primitives
│   │   └── snippets/       # Snippet-specific components
│   ├── db/                 # Drizzle schema & migrations
│   ├── lib/                # Utilities (auth, shiki, validation)
│   └── styles/             # Global CSS, Tailwind config
├── public/                 # Static assets (favicons, etc.)
├── Dockerfile              # Multi-stage production build
├── docker-compose.yml      # Docker orchestration
├── Caddyfile.example       # Reverse proxy with security headers
└── PRIVACY.md              # Privacy policy
```

## Security

- Passwords hashed with **Argon2id + Salt + Pepper**
- Session tokens stored as hashes, never plaintext
- Strict CSP and security headers via Caddy
- Zero external CDNs - everything bundled locally
- SQL injection prevented via Drizzle parameterized queries

See [docs/SECURITY.md](docs/SECURITY.md) for details.

## License

MIT
