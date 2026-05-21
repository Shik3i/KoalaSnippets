# Layout Components

Core UI components that form the three-pane IDE-like layout.

## Components

| Component | File | Type | Description |
|-----------|------|------|-------------|
| `Sidebar` | `sidebar.tsx` | Client | Left navigation pane. Branding, nav links, tag/language filters, new snippet button, settings link, sign out button. Responsive: collapses to drawer on mobile. |
| `ListView` | `list-view.tsx` | Client | Middle pane. Search bar with debounce (300ms), "Include code in search" toggle, scrollable snippet cards. Calls server-side search API dynamically. |
| `DetailView` | `detail-view.tsx` | Client | Right pane. Snippet title, description, metadata, Shiki-highlighted code block, copy button, owner actions (edit, delete, toggle visibility, share). |

## Layout Structure

```
+----------+------------------+------------------+
| Sidebar  |   ListView       |   DetailView     |
| (240px)  |   (320px)        |   (flex-1)       |
| fixed    |   shrink-0       |   overflow-auto  |
+----------+------------------+------------------+
```

## Responsive Behavior

- **Desktop (1024px+)**: All three panes visible.
- **Tablet (768px-1024px)**: Sidebar collapses to icon-only toggle.
- **Mobile (< 768px)**: Single pane. Sidebar becomes a slide-out drawer.

## Server/Client Split

All layout components are **Client Components** (`"use client"`) because they handle:
- Interactive search with debounce
- Clipboard operations (copy code, copy URL)
- Navigation state (selected snippet)
- Mobile drawer toggle

Data fetching is done by **Server Components** (page files) which pass initial data as props.
