# Settings API Routes

User account management endpoints.

## Routes

| Method | Route | Description | Auth Required |
|--------|-------|-------------|---------------|
| PUT | `/api/settings` | Change user password | Yes |

## Password Change Flow

1. Verify `Current Password` against stored hash using Argon2id + Salt + Pepper.
2. If valid, hash `New Password` with a **newly generated salt** + same pepper.
3. Update `passwordHash` in the database.
4. **Terminate all active sessions** for the user (forces re-login everywhere).

## Validation

- `passwordChangeSchema` from `@/lib/validations`:
  - `currentPassword`: required, non-empty
  - `newPassword`: 8+ chars, uppercase, lowercase, number
  - `confirmNewPassword`: must match `newPassword`

## Security

- Current password verification prevents unauthorized changes if session is hijacked.
- All sessions terminated after password change to invalidate any compromised sessions.
- New password gets a fresh random salt (never reuses old salt).
