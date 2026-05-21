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
- **Rate limiting** - In-memory brute-force protection on auth endpoints

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16+ (App Router, React Server Components) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS + shadcn/ui |
| Database | SQLite (better-sqlite3) |
| ORM | Drizzle ORM |
| Syntax Highlighting | Shiki (server-side) |
| Authentication | Session cookies + Argon2id + Pepper |

## Local Testing & Development

### 1. Set Up Environment Variables

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
# Required: Application-level pepper for password hashing (use a long random string)
AUTH_PEPPER=your-secret-pepper-string

# Required: Session encryption secret (use a long random string)
SESSION_SECRET=your-session-secret-string

# Optional: Enable/disable user registration (default: false)
ALLOW_REGISTRATION=true

# Optional: SQLite database file path (default: ./data/koalasnippets.db)
DATABASE_URL=file:./data/koalasnippets.db

# Optional: Environment (default: development)
NODE_ENV=development
```

Generate secure random strings:

```bash
# macOS / Linux
openssl rand -hex 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Install Dependencies & Initialize Database

```bash
npm install

# Create the data directory
mkdir -p data

# Generate and apply database migrations
npm run db:generate
npm run db:migrate
```

### 3. Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The server uses Turbopack for fast hot-reloading. The SQLite database is initialized automatically on first access.

### 4. Build & Test Production Locally (Docker)

```bash
# Build and run with Docker Compose
docker compose up --build

# Or build and run manually
docker build -t koalasnippets .
docker run -d -p 3000:3000 \
  -v koalasnippets-data:/app/data \
  -e AUTH_PEPPER=your-pepper \
  -e SESSION_SECRET=your-secret \
  -e ALLOW_REGISTRATION=true \
  koalasnippets
```

Open [http://localhost:3000](http://localhost:3000). The SQLite database persists across container restarts via the Docker volume.

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with Turbopack |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:generate` | Generate Drizzle migrations |
| `npm run db:migrate` | Apply database migrations |
| `npm run db:studio` | Open Drizzle Studio (DB browser) |

## Project Structure

```
KoalaSnippets/
├── docs/                   # Architecture & AI documentation
├── src/
│   ├── app/                # Next.js App Router (pages, API routes)
│   │   ├── api/            # API routes (auth, snippets, settings)
│   │   ├── dashboard/      # Dashboard (authenticated)
│   │   ├── login/          # Login page
│   │   ├── register/       # Registration page
│   │   ├── settings/       # User settings (password change)
│   │   ├── public/         # Public snippet explorer
│   │   └── snippets/[id]/  # Snippet detail view
│   ├── components/
│   │   ├── layout/         # Sidebar, list view, detail view
│   │   ├── ui/             # shadcn/ui primitives
│   │   ├── auth/           # Login/register forms
│   │   └── settings/       # Password change form
│   ├── db/                 # Drizzle schema & migrations
│   ├── lib/                # Utilities (auth, session, shiki, rate-limit, validations)
│   └── middleware.ts       # Route protection middleware
├── public/                 # Static assets
├── Dockerfile              # Multi-stage production build
├── docker-compose.yml      # Docker orchestration
├── Caddyfile.example       # Reverse proxy with security headers
└── PRIVACY.md              # Privacy policy
```

## Security

- Passwords hashed with **Argon2id + Salt + Pepper**
- Session tokens stored as hashes, never plaintext
- Strict CSP and security headers via Next.js config + Caddy
- Zero external CDNs - everything bundled locally
- SQL injection prevented via Drizzle parameterized queries
- Timing-attack-resistant token comparison (`crypto.timingSafeEqual`)
- Rate limiting on login (5 attempts/15min) and registration (3 attempts/60min)

See [docs/SECURITY.md](docs/SECURITY.md) for details.

## License

MIT
