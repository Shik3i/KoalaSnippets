# Snippet Components

Components for displaying and searching snippets in the 2-pane layout.

## Components

| Component | File | Description |
|-----------|------|-------------|
| `SnippetCard` | `snippet-card.tsx` | Card component for grid display. Shows title, language badge, description, tags, visibility icon. Links to `/snippets/[id]`. |
| `SnippetSearchHeader` | `search-header.tsx` | Sticky header with search input and "Include code in search" toggle. Debounces search (300ms) and triggers server-side search via URL params. |

## Layout Pattern

All list pages (Home, Dashboard, Public) follow this structure:
```
+----------+----------------------------------+
| Sidebar  |  SearchHeader (sticky)           |
| (fixed)  |  +----------------------------+  |
|          |  | SnippetCard | Card | Card  |  |
|          |  | SnippetCard | Card | Card  |  |
|          |  | SnippetCard | Card | Card  |  |
|          |  +----------------------------+  |
|          |  (responsive grid, scrollable)   |
+----------+----------------------------------+
```

The grid uses `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` for responsive layout.
