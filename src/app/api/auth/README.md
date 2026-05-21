# Authentication API Routes

Handles user registration, login, and logout.

## Routes

| Method | Route | Description | Auth Required |
|--------|-------|-------------|---------------|
| POST | `/api/auth/register` | Create a new user account | No (blocked if `ALLOW_REGISTRATION=false`) |
| POST | `/api/auth/login` | Authenticate user, create session | No |
| POST | `/api/auth/logout` | Destroy session, clear cookie | No (graceful if no session) |

## Security

- **Registration**: Guarded by `ALLOW_REGISTRATION` env var. Returns 403 if disabled.
- **Rate limiting**: Login limited to 5 attempts per 15min per IP. Registration limited to 3 attempts per 60min per IP.
- **Password hashing**: Argon2id + per-user random salt + application-level pepper (`AUTH_PEPPER`).
- **Sessions**: Cryptographically random 32-byte tokens, stored as SHA-256 hashes. Cookie flags: `HttpOnly`, `Secure`, `SameSite=Lax`.
- **Timing attacks**: Not applicable here (Argon2's `verify` is constant-time by design).

## Validation

All inputs validated with Zod schemas from `@/lib/validations`:
- `registerSchema`: username (3-32 chars, alphanumeric+underscore), password (8+ chars, uppercase, lowercase, number)
- `loginSchema`: non-empty username and password

## Files

| File | Purpose |
|------|---------|
| `register/route.ts` | POST: validates input, checks uniqueness, hashes password, inserts user |
| `login/route.ts` | POST: validates input, verifies password, creates session, sets cookie |
| `logout/route.ts` | POST: deletes session from DB, clears cookie |
