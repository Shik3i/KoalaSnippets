# Library Utilities

Core utility functions and helpers used across the application.

## Files

| File | Purpose | Key Exports |
|------|---------|-------------|
| `auth.ts` | Password hashing and token generation | `hashPassword()`, `verifyPassword()`, `generateSessionToken()`, `hashSessionToken()`, `generateShareToken()`, `generateId()` |
| `session.ts` | Session management (cookie-based) | `getSession()`, `createSession()`, `deleteSession()`, `setSessionCookie()` |
| `shiki.ts` | Server-side syntax highlighting | `highlightCode()`, `getAvailableLanguages()` |
| `validations.ts` | Zod schemas for input validation | `registerSchema`, `loginSchema`, `passwordChangeSchema`, `snippetSchema`, `updateSnippetSchema` |
| `rate-limit.ts` | In-memory rate limiter | `checkRateLimit()`, `cleanupExpiredRateLimits()` |
| `utils.ts` | General utilities | `cn()` (className merger) |
| `backup.ts` | SQLite backup with VACUUM INTO + GFS retention | `runVacuumBackup()`, `applyGfsRetention()`, `runBackupWithRetention()` |
| `backup-scheduler.ts` | Automated backup scheduler (6-hour interval) | `startBackupScheduler()`, `stopBackupScheduler()` |
| `keyboard-shortcuts.ts` | Global keyboard shortcut hook | `useKeyboardShortcuts()` |
| `admin-guard.ts` | Admin role verification helper | `requireAdmin()` |
| `seed.ts` | Admin user + statistics seeding on boot | `seedAdminUser()`, `seedStatistics()` |

## Security Notes

- **auth.ts**: Argon2id with per-user salt + application pepper. Pepper from `AUTH_PEPPER` env var. Falls back to dev pepper in development (with warning).
- **session.ts**: Session tokens are 32 random bytes, stored as SHA-256 hashes. Sliding expiration with 24h grace period (only writes DB if expiry is within 24h).
- **shiki.ts**: Singleton highlighter. Loads 30 languages at startup. Server-side only (never sent to client).
- **rate-limit.ts**: In-memory Map-based limiter. Auto-cleanup every 5 minutes. Designed for single-instance deployments.

## Backup System

- **backup.ts**: Uses SQLite `VACUUM INTO` for safe, non-corrupt backups. Implements Grandfather-Father-Son retention (7 daily, 4 weekly, 12 monthly).
- **backup-scheduler.ts**: Runs on server startup via `src/instrumentation.ts`. Initial backup + 6-hour interval cycle.
- **Environment**: `BACKUP_DIR` env var controls backup location (default: `./backups`).
