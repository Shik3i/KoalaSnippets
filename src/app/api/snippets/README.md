# Snippets API Routes

CRUD operations for snippets with visibility-based access control.

## Routes

| Method | Route | Description | Auth Required |
|--------|-------|-------------|---------------|
| GET | `/api/snippets` | List snippets (with search, pagination) | No (PUBLIC only without auth) |
| POST | `/api/snippets` | Create a new snippet | Yes |
| GET | `/api/snippets/[id]` | Get single snippet | Conditional (see visibility) |
| PUT | `/api/snippets/[id]` | Update snippet | Yes (owner only) |
| DELETE | `/api/snippets/[id]` | Delete snippet | Yes (owner only) |

## Query Parameters (GET /api/snippets)

| Param | Type | Description |
|-------|------|-------------|
| `q` | string | Search query (searches title, language, tags, optionally code) |
| `includeCode` | boolean | If true, also search within the `code` field |
| `visibility` | string | Filter by visibility (`PUBLIC` for unauthenticated access) |
| `page` | number | Page number (default: 1, 50 per page) |

## Visibility Logic

- **PUBLIC**: Anyone can list and view. Listed on public explorer.
- **SHARED**: Only accessible via exact URL with `?token=[shareToken]`. Never listed. Token comparison uses `crypto.timingSafeEqual` to prevent timing attacks.
- **PRIVATE**: Only visible to the authenticated author. Returns 404 (not 403) to avoid leaking existence.

## Security

- All queries use Drizzle parameterized `like()` operators (SQL injection safe).
- `shareToken` comparison uses constant-time comparison.
- `shareToken` only returned in API response when `visibility === "SHARED"`.
- Owner verification on all write operations (PUT, DELETE).

## Files

| File | Purpose |
|------|---------|
| `route.ts` | GET (list with search/pagination), POST (create) |
| `[id]/route.ts` | GET (single with visibility check), PUT (update), DELETE (delete) |
