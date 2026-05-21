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

## Security Notes

- **auth.ts**: Argon2id with per-user salt + application pepper. Pepper from `AUTH_PEPPER` env var. Falls back to dev pepper in development (with warning).
- **session.ts**: Session tokens are 32 random bytes, stored as SHA-256 hashes. Sliding expiration with 24h grace period (only writes DB if expiry is within 24h).
- **shiki.ts**: Singleton highlighter. Loads 30 languages at startup. Server-side only (never sent to client).
- **rate-limit.ts**: In-memory Map-based limiter. Auto-cleanup every 5 minutes. Designed for single-instance deployments.
