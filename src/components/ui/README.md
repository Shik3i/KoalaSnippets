# UI Components (shadcn/ui pattern)

Minimal, copy-paste UI primitives following the shadcn/ui design pattern. No external UI library dependency.

## Components

| Component | File | Description |
|-----------|------|-------------|
| `Button` | `button.tsx` | Button with variants (default, destructive, outline, ghost, link), sizes (default, sm, lg, icon), and `asChild` support via `@radix-ui/react-slot`. |
| `Input` | `input.tsx` | Text input with focus ring, disabled state, and file input support. |
| `Textarea` | `textarea.tsx` | Multi-line text input with auto min-height. |
| `Badge` | `badge.tsx` | Status/label badge with variants (default, secondary, destructive, outline, success, warning). |
| `Card` | `card.tsx` | Card container with sub-components: `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`. |
| `Label` | `label.tsx` | Form label with disabled state styling. |

## Design Tokens

All components use CSS custom properties defined in `src/app/globals.css`:
- Colors: `--color-background`, `--color-foreground`, `--color-primary`, `--color-muted`, etc.
- Radii: `--radius-sm`, `--radius-md`, `--radius-lg`

## Adding New Components

Follow the pattern:
1. Use `React.forwardRef` for ref forwarding.
2. Accept `className` prop and merge with `cn()` utility.
3. Provide sensible defaults for variants/sizes.
4. Keep each component under 100 lines.
