# Layout Components

Core UI components for the 2-pane layout (Sidebar + Main Content).

## Components

| Component | File | Type | Description |
|-----------|------|------|-------------|
| `Sidebar` | `sidebar.tsx` | Client | Left navigation pane (fixed width). Branding, nav links, tag/language filters, new snippet button (auth only), settings/sign-in, legal links. Responsive: collapses to drawer on mobile. |
| `DetailView` | `detail-view.tsx` | Client | Full-width snippet detail view. Title, description, metadata, Shiki-highlighted code block, copy button, owner actions (edit, delete, toggle visibility, share). |

## Layout Structure (2-Pane)

```
+----------+----------------------------------+
| Sidebar  |  Main Content Area               |
| (fixed)  |  (flex-1, full remaining width)  |
|          |                                  |
| Nav      |  List View:                      |
| Tags     |    - Sticky search header        |
| Actions  |    - Responsive card grid        |
|          |                                  |
|          |  Detail View:                    |
|          |    - Back button                 |
|          |    - Full-width code display     |
+----------+----------------------------------+
```

## Server/Client Split

- **Sidebar**: Client Component (interactive navigation, mobile drawer toggle)
- **DetailView**: Client Component (clipboard operations, interactive actions)
- **SearchHeader**: Client Component (debounced search, URL manipulation)
- **SnippetCard**: Client Component (Link navigation)

Data fetching is done by Server Components (page files) which pass data as props or use URL search params.

## Responsive Behavior

- **Desktop (1024px+)**: Sidebar visible, 3-column card grid
- **Tablet (768px-1024px)**: Sidebar visible, 2-column card grid
- **Mobile (< 768px)**: Sidebar collapses to drawer, 1-column card grid
