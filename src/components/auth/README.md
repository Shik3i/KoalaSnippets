# Auth Components

Authentication-related client components.

## Components

| Component | File | Description |
|-----------|------|-------------|
| `LoginForm` | `login-form.tsx` | Login form with username/password fields. Submits to `POST /api/auth/login`. Redirects to `/dashboard` on success. Handles error display. |
| `RegisterForm` | `register-form.tsx` | Registration form with username/password/confirm fields. Submits to `POST /api/auth/register`. Redirects to `/dashboard` on success. Password match validation client-side. |

## Server-Side Guard

The `/register` page is guarded server-side. If `ALLOW_REGISTRATION !== "true"`, the page redirects to `/login` before rendering. The `RegisterForm` component is never sent to the browser when registration is disabled.

## Form Behavior

- Both forms display inline error messages for API errors.
- Loading state disables the submit button during requests.
- Password fields use `autoComplete` attributes for browser password manager compatibility.
