# 🐨 KoalaSnippets

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![SQLite](https://img.shields.io/badge/Database-SQLite-003B57?style=flat-square&logo=sqlite)](https://www.sqlite.org/)
[![Self-Hosted](https://img.shields.io/badge/Self--Hosted-Yes-2ea44f?style=flat-square)]()
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

> A blazing fast, zero-bloat, privacy-first snippet manager designed to cure **Notepad++ tab hell**.

KoalaSnippets is a self-hosted web application for storing, organizing, and sharing code snippets. It features a clean two-pane interface, server-side syntax highlighting, and rock-solid security — all with **zero external dependencies**. No CDNs. No tracking. No bloat. Just your code, your server, your rules.

![KoalaSnippets Interface](./docs/assets/screenshot-placeholder.png)

## ✨ Core Features

- 🔒 **Privacy by Default** — Zero CDNs, locally hosted fonts, self-hosted. Your data never leaves your server.
- 🛡️ **Rock-Solid Security** — Argon2id + Salt + Pepper password hashing, in-memory rate limiting, strict CSP headers, timing-attack-resistant token comparison.
- 👁️ **Visibility Controls** — Public Explorer for anyone, secure shared links with unguessable tokens, or keep snippets strictly private.
- ⚡ **Blazing Fast Search** — Server-side parameterized queries with an "include code in search" toggle. No client-side filtering bottlenecks.
- 🎨 **Beautiful 2-Pane UI** — Responsive card grid, dark mode by default, clean shadcn/ui components, JetBrains Mono for code.
- 💻 **Developer Ready** — Shiki server-side syntax highlighting for 30+ languages, one-click copy-to-clipboard, tag-based organization.

## 🧱 Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router, React Server Components) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Database | SQLite (better-sqlite3) |
| ORM | Drizzle ORM |
| Syntax Highlighting | Shiki (server-side, 30+ languages) |
| Authentication | Session cookies + Argon2id + Pepper |
| Fonts | next/font/google (Inter, JetBrains Mono) |
| Icons | lucide-react (bundled) |

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- npm (or pnpm/yarn)

### 1. Clone & Install

```bash
git clone https://github.com/Shik3i/KoalaSnippets.git
cd KoalaSnippets
npm install
```

### 2. Set Up Environment

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
# Required: Application-level pepper for password hashing
AUTH_PEPPER=your-long-random-string-here

# Required: Session encryption secret
SESSION_SECRET=another-long-random-string

# Optional: Enable/disable user registration (default: false)
ALLOW_REGISTRATION=true

# Optional: SQLite database path
DATABASE_URL=file:./data/koalasnippets.db
```

Generate secure random strings:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Initialize Database

```bash
mkdir -p data
npm run db:generate
npm run db:migrate
```

### 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The server uses Turbopack for instant hot-reloading. The SQLite database initializes automatically on first access.

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with Turbopack |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:generate` | Generate Drizzle migrations |
| `npm run db:migrate` | Apply database migrations |
| `npm run db:studio` | Open Drizzle Studio (web-based DB browser) |

## 🐳 Docker Deployment

### Docker Compose (Recommended)

```bash
# Set environment variables
export AUTH_PEPPER="your-pepper"
export SESSION_SECRET="your-secret"
export ALLOW_REGISTRATION="true"

# Build and run
docker compose up --build -d
```

Open [http://localhost:3000](http://localhost:3000). The SQLite database persists across container restarts via a Docker volume.

### Manual Docker

```bash
docker build -t koalasnippets .
docker run -d -p 3000:3000 \
  -v koalasnippets-data:/app/data \
  -e AUTH_PEPPER=your-pepper \
  -e SESSION_SECRET=your-secret \
  -e ALLOW_REGISTRATION=true \
  koalasnippets
```

### Reverse Proxy (Caddy)

See `Caddyfile.example` for a production-ready Caddy configuration with strict security headers (CSP, HSTS, X-Content-Type-Options).

## 📁 Project Structure

```
KoalaSnippets/
├── docs/                   # Architecture, security, and AI documentation
├── src/
│   ├── app/                # Next.js App Router (pages, API routes)
│   │   ├── api/            # API routes (auth, snippets, settings)
│   │   ├── dashboard/      # Dashboard (authenticated, responsive grid)
│   │   ├── snippets/[id]/  # Dedicated snippet detail view
│   │   ├── settings/       # User settings (password change)
│   │   ├── impressum/      # German imprint
│   │   └── privacy/        # Privacy policy
│   ├── components/
│   │   ├── layout/         # Sidebar, detail view
│   │   ├── snippets/       # SnippetCard, SnippetSearchHeader
│   │   ├── ui/             # shadcn/ui primitives
│   │   ├── auth/           # Login/register forms
│   │   └── settings/       # Password change form
│   ├── db/                 # Drizzle schema, migrations, connection
│   └── lib/                # Auth, session, Shiki, rate-limit, validations
├── Dockerfile              # Multi-stage production build
├── docker-compose.yml      # Docker orchestration
├── Caddyfile.example       # Reverse proxy with security headers
└── PRIVACY.md              # Detailed privacy policy
```

## 🔐 Security

- Passwords hashed with **Argon2id + Salt + Pepper**
- Session tokens stored as hashes, never plaintext
- Strict CSP and security headers via Next.js config + Caddy
- Zero external CDNs — everything bundled locally
- SQL injection prevented via Drizzle parameterized queries
- Timing-attack-resistant token comparison (`crypto.timingSafeEqual`)
- Rate limiting on login (5/15min) and registration (3/60min)

See [docs/SECURITY.md](docs/SECURITY.md) for the full security specification.

## 📄 License

MIT
