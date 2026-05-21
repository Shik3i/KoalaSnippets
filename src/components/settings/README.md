# Settings Components

User account settings components.

## Components

| Component | File | Description |
|-----------|------|-------------|
| `PasswordChangeForm` | `password-change-form.tsx` | Password change form with three fields: Current Password, New Password, Confirm New Password. Submits to `PUT /api/settings`. On success, redirects to `/login` after 2 seconds (all sessions are terminated server-side). |

## Security

- Client-side validation mirrors server-side Zod schema.
- Success message informs user they will be logged out.
- Form clears all fields after successful submission.
