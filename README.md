<div align="center">

<img src="./public/MainLogo.png" alt="KoalaSnippets Logo" width="120" height="120" style="margin-bottom: 1px;" />

# KoalaSnippets

**The cure for Notepad++ tab hell — a self-hosted snippet manager for all those unnamed code files.**

[![Version](https://img.shields.io/badge/Version-1.13.5-blue?style=for-the-badge)](https://github.com/Shik3i/KoalaSnippets/pkgs/container/koalasnippets)
[![Docker Image](https://img.shields.io/badge/GHCR-Latest-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://github.com/Shik3i/KoalaSnippets/pkgs/container/koalasnippets)
[![Build Status](https://img.shields.io/github/actions/workflow/status/Shik3i/KoalaSnippets/docker-build.yml?style=for-the-badge&logo=github&label=Build)](https://github.com/Shik3i/KoalaSnippets/actions)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![SQLite](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

KoalaSnippets is a self-hosted web application for storing, organizing, and sharing code snippets. Make them taggable, searchable, filterable — and finally get rid of those thousands of unnamed files in Notepad++. Features a two-pane interface, server-side syntax highlighting, and a self-contained build with no external CDN calls. Your code, your server, your rules.

</div>

<details>
<summary><b>Table of Contents</b></summary>

- [✨ Core Features](#-core-features)
- [🧱 Tech Stack](#-tech-stack)
- [🚀 Quick Start](#-quick-start)
- [🐳 Docker Deployment](#-docker-deployment)
- [📁 Project Structure](#-project-structure)
- [🔐 Security](#-security)
- [🌐 Translations & Localization](#-translations--localization)
- [🗺️ Roadmap](#️-roadmap)
- [📄 License](#-license)

<br/>
</details>

## ✨ Core Features

### 🛡️ Privacy & Security

| Feature | Description |
|---------|-------------|
| **Argon2id Password Hashing** | Passwords secured with Argon2id, per-user salt, and an application-level pepper via `AUTH_PEPPER`. |
| **Timing-Attack-Resistant Comparisons** | Share tokens and API keys compared using `crypto.timingSafeEqual` with SHA-256 normalization. |
| **Content Security Policy** | Strict CSP headers configured in Next.js and optionally enforced via Caddy reverse proxy. |
| **Visibility Controls** | Public Explorer for anyone, secure shared links with unguessable tokens, or keep snippets strictly private. |

### 🎨 User Interface

| Feature | Description |
|---------|-------------|
| **Command Palette** | `Ctrl+K` / `⌘K` opens a search and command palette with shortcuts like `/new`, `/settings`, `/admin`, and `/theme`. |
| **Keyboard Shortcuts** | 14+ shortcuts including vim-style navigation (`j`/`k`), `Cmd+S` to save, `Cmd+Shift+N` for new snippets, and `?` for help. |
| **Themes & Backgrounds** | 7 app themes (Dark, Midnight, Nordic, Dracula, Terracotta, Hacker, Light) and 12 CSS background patterns. |
| **Statistics Page** | Public metrics tracking total snippets, lines of code, unique tags, languages, and more. |
| **2-Pane Layout** | Responsive card grid with dark mode by default, JetBrains Mono for code, and a collapsible sidebar. |
| **Internationalization** | Full English and German localization with a language toggle. Extensible via locale files. |

### ⚡ Developer Workflow

| Feature | Description |
|---------|-------------|
| **Multi-File Snippets & Collections** | Group related code files within a single snippet. Organize with tags, collections, and favorites. |
| **Custom Code Editor** | A lightweight editor with Tab indentation, bracket auto-closing, overtype skipping, and pair-matching deletions. |
| **Server-Side Syntax Highlighting** | Shiki-based highlighting for 30+ languages, with languages and themes lazy-loaded on demand. |
| **Search & Filters** | Server-side search with an "include code in search" toggle, filterable by tags and languages, with OR/AND logic. |

### 📦 Reliability

| Feature | Description |
|---------|-------------|
| **WAL-Mode SQLite** | Write-Ahead Logging with tuned busy timeouts for concurrent read/write access. |
| **Automated Backups** | Built-in `VACUUM INTO` backup scheduler with Grandfather-Father-Son retention (7 daily, 4 weekly, 12 monthly). |
| **Admin Panel** | Role-based admin dashboard for managing users, triggering backups, and monitoring system health. |

## 🧱 Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router, React Server Components) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS v4 + shadcn/ui-inspired components |
| Database | SQLite via better-sqlite3 |
| ORM | Drizzle ORM |
| Syntax Highlighting | Shiki (server-side with lazy-loaded language modules) |
| Authentication | Session cookies + Argon2id + Pepper + RBAC |
| Fonts | next/font/google (Inter, JetBrains Mono) |
| Icons | lucide-react (bundled) |
| i18n | Custom React Context + typed locale files (EN, DE) |

## 🚀 Quick Start

### Prerequisites

- Node.js 20+ (Node.js 22 used in Docker)
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

# Optional: Shared secret for programmatic API access (bypasses CSRF checks)
# API_KEY=your-api-key-here
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

Open [http://localhost:3000](http://localhost:3000). The server uses Turbopack for fast hot-reloading. The SQLite database initializes automatically on first access.

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

See `Caddyfile.example` for a production-ready Caddy configuration with security headers (CSP, HSTS, X-Content-Type-Options).

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
│   ├── features/           # Domain-driven feature folders
│   │   ├── admin/          # Backup UI lists, metrics, scheduling logic & admin guards
│   │   ├── auth/           # Login/register forms, session handlers & crypt auth utils
│   │   ├── snippets/       # Snippet cards, search header, custom CodeEditor, sort/view toggles & lazy Shiki highlighting
│   │   │   └── utils/      #   Keyboard shortcuts, filter logic (OR/AND), shared constants
│   │   └── core/           # Common layouts, confirm modals, rate limiters, CommandPalette & i18n
│   ├── components/
│   │   └── ui/             # shadcn/ui-inspired base primitives (buttons, inputs, cards, toasts, confirm-modal)
│   ├── db/                 # Drizzle schema, migrations, connection (WAL enabled)
│   ├── proxy.ts            # Next.js Middleware
│   ├── instrumentation.ts  # Server lifecycle hooks (backup, seeding)
├── Dockerfile              # Multi-stage production build
├── docker-compose.yml      # Docker orchestration
└── Caddyfile.example       # Reverse proxy with security headers
```

## 🌐 Translations & Localization (i18n)

KoalaSnippets is fully localized in both **English** and **German**.

Want to contribute a translation? See the **[i18n Translation & Contribution Guide](src/features/core/i18n/README.md)** for details on adding a new language.

## 🔐 Security

- Passwords hashed with **Argon2id + Salt + Pepper**
- Session tokens stored as HMAC-SHA-256 hashes, never plaintext
- Strict CSP and security headers via Next.js config + Caddy
- No external CDN calls — all assets bundled locally
- SQL injection prevented via Drizzle parameterized queries
- Timing-attack-resistant token comparison (`crypto.timingSafeEqual`)
- Rate limiting on login (5/15min) and registration (3/60min)
- Role-based access control (RBAC) — admin routes return 403 for non-admins

See [docs/SECURITY.md](docs/SECURITY.md) for the full security specification.

## 🗺️ Roadmap

Check the [Roadmap](docs/ROADMAP.md) to see planned features like CLI integration and API keys.

## 📄 License

MIT
