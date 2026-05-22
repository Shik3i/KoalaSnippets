<div align="center">

# 🐨 KoalaSnippets

**A blazing fast, zero-bloat, privacy-first snippet manager designed to cure Notepad++ tab hell.**

[![Version](https://img.shields.io/github/v/tag/Shik3i/KoalaSnippets?style=for-the-badge&label=Version&color=blue)](https://github.com/Shik3i/KoalaSnippets/releases)
[![Docker Image](https://img.shields.io/badge/Docker-Latest-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://hub.docker.com/r/shik3i/koalasnippets)
[![Build Status](https://img.shields.io/github/actions/workflow/status/Shik3i/KoalaSnippets/docker-build.yml?style=for-the-badge&logo=github&label=Build)](https://github.com/Shik3i/KoalaSnippets/actions)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![SQLite](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

<br />
<a href="https://snippets.koalastuff.net">
  <img src="https://img.shields.io/badge/Live_Demo-snippets.koalastuff.net-FF6B6B?style=for-the-badge" alt="Live Demo" />
</a>
<br />

KoalaSnippets is a self-hosted web application for storing, organizing, and sharing code snippets. It features a clean two-pane interface, server-side syntax highlighting, and rock-solid security — all with **zero external dependencies**. No CDNs. No tracking. No bloat. Just your code, your server, your rules.

<!-- We recommend replacing this placeholder with a short feature showcase GIF -->
<img src="./docs/assets/screenshot-placeholder.png" alt="KoalaSnippets Interface Demo" width="800" style="border-radius: 8px; margin-top: 20px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" />

</div>

<details>
<summary><b>📚 Table of Contents</b></summary>

- [✨ Core Features](#-core-features)
- [🧱 Tech Stack](#-tech-stack)
- [🚀 Quick Start](#-quick-start)
- [🐳 Docker Deployment](#-docker-deployment)
- [📁 Project Structure](#-project-structure)
- [🔐 Security](#-security)
- [📄 License](#-license)

<br/>
</details>

## ✨ Core Features

- 🔒 **Privacy by Default** — Zero CDNs, locally hosted fonts, self-hosted. Your data never leaves your server.
- 🛡️ **Rock-Solid Security** — Argon2id + Salt + Pepper password hashing, in-memory rate limiting, strict CSP headers, timing-attack-resistant token comparison.
- 👁️ **Visibility Controls** — Public Explorer for anyone, secure shared links with unguessable tokens, or keep snippets strictly private.
- ⚡ **Blazing Fast Search** — Server-side parameterized queries with an "include code in search" toggle. No client-side filtering bottlenecks.
- 🎨 **Appearance & Theme Customization** — Personalize your experience with 7 premium themes (Default Dark, Midnight Blue, Nordic Frost, Dracula, Cozy Terracotta, Hacker Green, Light Mode), 4 CSS-driven background patterns (Flat, Subtle Dots, Mesh Grid, Soft Glow), customizable list densities (Compact, 5-Line Preview, Full Code), and 6 lazy-loaded syntax highlighting themes with an interactive real-time visual mockup preview.
- 🎨 **Beautiful 2-Pane UI** — Responsive card grid, dark mode by default, clean shadcn/ui components, JetBrains Mono for code.
- 💻 **Developer Ready** — Shiki server-side syntax highlighting for 30+ languages, one-click copy-to-clipboard, tag-based organization.
- ⌨️ **Premium Custom `CodeEditor`** — Zero-dependency native code editor supporting automatic Tab indentation spaces, matching brackets/quotes auto-closing, overtyping skip, and backspace pair matching deletions.
- 🔍 **Glassmorphic `CommandPalette`** — Global `Ctrl+K` / `⌘K` frosted-glass overlay HUD to search snippets in real-time or execute slash commands (`/new`, `/settings`, `/backups`, `/home`, `/dashboard`).
- 📥 **Download Code** — Download snippets as files with correct extensions.
- 🚀 **High Performance & WAL Mode** — Hardened SQLite with Write-Ahead Logging (WAL), busy timeout configuration, and normal synchronous writes alongside lazy-loaded Shiki languages for ultra-fast response.
- 🔄 **Automated Backups** — SQLite `VACUUM INTO` with GFS retention (7 daily, 4 weekly, 12 monthly).
- 🛡️ **Admin Dashboard** — RBAC with admin seeding, user management, backup management, system metrics.
- 📊 **Public Statistics** — Community metrics page with lifetime counters.
- 🔔 **Toast Notifications** — Animated feedback for all user actions.

## 🧱 Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router, React Server Components) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Database | SQLite (better-sqlite3) |
| ORM | Drizzle ORM |
| Syntax Highlighting | Shiki (server-side with lazy-loading language modules) |
| Authentication | Session cookies + Argon2id + Pepper + RBAC |
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

# Optional: Admin user seeded on first boot
# CRITICAL: These default credentials ('admin' / 'admin') are for local testing only
# and MUST be changed to secure values before deploying to production!
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin

# Optional: Enable/disable user registration (default: false)
ALLOW_REGISTRATION=true

# Optional: SQLite database path
DATABASE_URL=file:./data/koalasnippets.db

# Optional: Backup directory (default: ./backups)
BACKUP_DIR=./backups
```

> [!WARNING]
> The default seeded administrator credentials (`ADMIN_USERNAME=admin` / `ADMIN_PASSWORD=admin`) are strictly for local development and verification. You **MUST** change them to secure random values before pushing to staging or running in production!

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
export ADMIN_USERNAME="admin"
export ADMIN_PASSWORD="your-secure-password"

# Build and run
docker compose up --build -d
```

Open [http://localhost:3000](http://localhost:3000). The SQLite database and backups persist across container restarts via Docker volumes.

### Manual Docker

```bash
docker build -t koalasnippets .
docker run -d -p 3000:3000 \
  -v koalasnippets-data:/app/data \
  -v koalasnippets-backups:/app/backups \
  -e AUTH_PEPPER=your-pepper \
  -e SESSION_SECRET=your-secret \
  -e ALLOW_REGISTRATION=true \
  -e ADMIN_USERNAME=admin \
  -e ADMIN_PASSWORD=your-secure-password \
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
│   │   ├── api/            # API routes
│   │   │   ├── auth/       # Login, logout, register
│   │   │   ├── snippets/   # CRUD operations
│   │   │   ├── settings/   # Password change & appearance update
│   │   │   ├── admin/      # Admin-only: users, backups, stats
│   │   │   ├── health/     # Health check endpoint
│   │   │   └── public/     # Public API (stats)
│   │   ├── admin/          # Admin dashboard (RBAC protected)
│   │   ├── dashboard/      # User snippet management
│   │   ├── snippets/[id]/  # Snippet detail view
│   │   ├── settings/       # User settings & Appearance settings
│   │   ├── stats/          # Public statistics page
│   │   ├── impressum/      # German imprint
│   │   └── privacy/        # Privacy policy
│   ├── features/           # Domain-driven features folders (Restructured)
│   │   ├── admin/          # Backup UI lists, metrics, scheduling logic & admin guards
│   │   ├── auth/           # Login/register forms, session handlers & crypt auth utils
│   │   ├── snippets/       # Snippet cards, search header, custom CodeEditor & lazy Shiki highlighting
│   │   └── core/           # Common layouts (sidebar, detail-view), global rate limiters, CommandPalette & styles
│   ├── components/
│   │   └── ui/             # shadcn/ui base primitive layouts (buttons, inputs, cards, toasts)
│   ├── db/                 # Drizzle schema, migrations, connection (WAL enabled)
│   ├── instrumentation.ts      # Server lifecycle hooks (backup, seeding)
│   ├── Dockerfile              # Multi-stage production build
│   ├── docker-compose.yml      # Docker orchestration
│   ├── Caddyfile.example       # Reverse proxy with security headers
│   └── PRIVACY.md              # Detailed privacy policy
```

## 🔐 Security

- Passwords hashed with **Argon2id + Salt + Pepper**
- Session tokens stored as hashes, never plaintext
- Strict CSP and security headers via Next.js config + Caddy
- Zero external CDNs — everything bundled locally
- SQL injection prevented via Drizzle parameterized queries
- Timing-attack-resistant token comparison (`crypto.timingSafeEqual`)
- Rate limiting on login (5/15min) and registration (3/60min)
- Role-based access control (RBAC) — admin routes return 403 for non-admins

See [docs/SECURITY.md](docs/SECURITY.md) for the full security specification.

## 📄 License

MIT
