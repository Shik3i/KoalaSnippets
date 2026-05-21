# Database Layer

Drizzle ORM schema, connection, and migrations for SQLite.

## Schema

Three tables defined in `schema.ts`:

| Table | Columns | Description |
|-------|---------|-------------|
| `users` | `id` (UUID), `username` (unique), `passwordHash`, `createdAt` | User accounts |
| `snippets` | `id` (UUID), `title`, `description`, `code`, `language`, `tags` (JSON), `authorId` (FK), `visibility` (enum), `shareToken` (unique), `createdAt`, `updatedAt` | Code snippets |
| `sessions` | `id` (UUID), `userId` (FK), `tokenHash`, `expiresAt`, `createdAt` | Auth sessions |

Relations are defined via Drizzle's `relations()` helper for type-safe joins.

## Connection

`index.ts` uses a **lazy initialization** pattern with a Proxy to avoid database access during Next.js build time (which would fail in CI/production builds). The SQLite connection is only created on first actual query.

- Journal mode: WAL (write-ahead logging)
- Foreign keys: enabled
- Database path: from `DATABASE_URL` env var, defaults to `./data/koalasnippets.db`

## Migrations

Generated via `drizzle-kit generate` and applied via `drizzle-kit migrate`.

Migration files are stored in `migrations/` directory.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run db:generate` | Generate migration SQL from schema changes |
| `npm run db:migrate` | Apply pending migrations to the database |
| `npm run db:studio` | Open Drizzle Studio (web-based DB browser) |
