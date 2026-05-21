# Snippet Components

Components for displaying and searching snippets in the 2-pane layout.

## Components

| Component | File | Description |
|-----------|------|-------------|
| `SnippetCard` | `snippet-card.tsx` | Card component for responsive grid display. Shows title, language badge, description, tags, visibility icon. Links to `/snippets/[id]`. |
| `SnippetSearchHeader` | `search-header.tsx` | Sticky header with search input and "Include code in search" toggle. Debounces search (300ms) and updates URL params via `useSearchParams`/`usePathname`/`router.replace`. |

## Layout Pattern

All list pages (Home, Dashboard, Public) follow this structure:
```
+----------+----------------------------------+
| Sidebar  |  SnippetSearchHeader (sticky)    |
| (fixed)  |  +----------------------------+  |
|          |  | Card | Card | Card          |  |
|          |  | Card | Card | Card          |  |
|          |  +----------------------------+  |
|          |  (responsive grid, scrollable)   |
+----------+----------------------------------+
```

The grid uses `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` for responsive layout.

## Search Flow

1. User types in `SnippetSearchHeader` → debounced 300ms
2. Component updates URL via `router.replace` (`?q=...&includeCode=...`)
3. Server Component re-renders with new `searchParams`
4. Drizzle `LIKE` query executes server-side (parameterized, SQL-injection safe)
5. New results rendered in grid
