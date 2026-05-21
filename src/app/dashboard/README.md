# Dashboard Pages

Authenticated user dashboard and snippet management.

## Routes

| Route | Type | Description |
|-------|------|-------------|
| `/dashboard` | Server Component | Main dashboard. Three-pane layout with user's snippets. Redirects to `/login` if unauthenticated. |
| `/dashboard/new` | Client Component | Create new snippet form. Fields: title, description, code, language, tags, visibility. |

## Dashboard Page

- Fetches all user snippets server-side (ordered by `createdAt DESC`).
- Extracts unique languages and tags for sidebar filtering.
- Renders first snippet's highlighted code via Shiki (server-side).
- `ListView` component handles client-side search with server API calls.

## New Snippet Page

- Client-side form with tag management (add/remove, max 10).
- Visibility selector: Private, Shared, Public.
- On success, redirects to `/dashboard` and refreshes data.
