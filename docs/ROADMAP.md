# 🗺️ KoalaSnippets Roadmap

This document outlines planned features, ideas, and long-term goals for KoalaSnippets.

## 🚀 Planned Features

### Personal API Keys & CLI-Integration

**Status**: Planned  
**Description**: Power-Users should be able to push and manage snippets directly from their terminal or CI/CD pipelines without opening the browser. 
Users can generate personal API keys (Bearer tokens) in their account settings.

**Example Workflow**:
```bash
# Push a local file directly as a new snippet
cat error.log | koala push --title "Nginx Crash Log" --visibility private

# Response
> Snippet created successfully! Link: https://snippets.koalastuff.net/snippets/abc123xyz
```

**Technical Implementation Details**:
- **Database**: Add `api_keys` table linking to `users` with hashed tokens.
- **Backend**: Extend the authentication middleware to accept `Authorization: Bearer <token>` alongside standard session cookies.
- **Frontend**: Add an "API Keys" section in `/settings` to generate and revoke keys.
- **CLI Tool**: Provide a simple bash/Go/Node CLI wrapper (`koala`) in a separate repository or as a downloadable script.

---

### Statisches Edge-Caching (ISR) für öffentliche Snippets & Stats

**Status**: Planned  
**Description**: High-traffic public snippets and the public statistics dashboard should be served with sub-millisecond response times under heavy load. By using Next.js Incremental Static Regeneration (ISR) and Edge Caching, public requests bypass database query overhead entirely.

**Example Workflow**:
- An unauthenticated user visits `/stats` or a public snippet.
- Next.js serves a pre-rendered static HTML page directly from the cache.
- When an owner updates a snippet, `revalidatePath` is called, silently rebuilding the cached page in the background for the next visitor.

**Technical Implementation Details**:
- **Caching**: Utilize `revalidatePath("/snippets/[id]")` and `revalidatePath("/stats")` in Server Actions.
- **Optimizations**: Add Cache-Control and stale-while-revalidate directives for downstream CDN caching.

### Developer Tools Hub (/tools)

**Status**: Planned  
**Description**: A dedicated suite of essential, privacy-first developer tools available directly within KoalaSnippets. This hub will be accessible to both authenticated and unauthenticated users. The main `/tools` page will feature a grid of beautiful, interactive cards representing each tool. Clicking a card opens the tool in a dedicated full-screen view (e.g., `/tools/hash-generator`).
All tools will run 100% locally in the browser (client-side) to ensure maximum privacy and zero latency.

**Proposed Tools**:
- **GUID/UUID Generator**: Generate v4 UUIDs individually or in bulk, with options to copy them directly or format them as SQL/JSON arrays.
- **Random String & Password Generator**: Highly customizable generator. Checkboxes for uppercase, lowercase, numbers, and symbols. Option to exclude ambiguous characters (like `l`, `1`, `I`, `O`, `0`).
- **Text Diff Checker**: A dual-pane split-view editor. Paste original text on the left and modified text on the right to instantly highlight line-by-line and inline character differences.
- **Hash Generator**: Real-time hashing. Type a string and instantly see its MD5, SHA-1, SHA-256, SHA-512, and Bcrypt hashes.
- **JSON Formatter & Validator**: Paste minified or broken JSON to instantly beautify it, or find exactly where the syntax error is.
- **JWT Decoder**: Paste a JSON Web Token to decode its header and payload visually. Crucially, the signature is not verified against a server, so no sensitive token data ever leaves the user's machine.
- **Base64 Encoder/Decoder**: Two-way data encoding.

**Example Workflow**:
- User needs a strong random ID for a new database record.
- Instead of googling and using a sketchy third-party site, they visit `https://snippets.koalastuff.net/tools`.
- They click the "String Generator" card.
- They check "Include Symbols", set length to 32, click "Generate", and immediately hit "Copy".

**Technical Implementation Details**:
- **Frontend Architecture**: Create a new route group `(tools)` inside `app/` to handle `/tools` and `/tools/[toolSlug]`.
- **UI Components**: Build a responsive grid for the hub using our existing `DetailView` glassmorphic styling.
- **Logic**: Use browser-native APIs where possible (e.g., `crypto.randomUUID()` and `crypto.subtle.digest()` for hashing) to maintain the zero-bloat philosophy. Only use lightweight external libraries if absolutely necessary (like `diff` for text comparisons).

---

### Snippet Forking (Community Remixes)

**Status**: Planned  
**Description**: Allow users to "fork" public snippets of other developers into their own account. The forked snippet remains fully independent and editable, but retains a dynamic reference to the original source. This encourages community collaboration, sharing, and turns public snippets into reusable, living templates.

**Example Workflow**:
- An authenticated user views a public snippet authored by `@alice`.
- They click a beautiful glassmorphic **"Fork"** button on the snippet's detail page.
- A copy of the snippet is instantly cloned into the user's dashboard.
- The user's new snippet shows a subtle badge: *“Forked from @alice”*.
- The user can modify, customize, or share their copy without affecting Alice's original.

**Technical Implementation Details**:
- **Database Schema**: Add a nullable `forked_from_id` column to the `snippets` table (pointing back to `snippets.id` with `ON DELETE SET NULL`).
- **Backend API**: Add a Server Action `forkSnippet(id)` that clones the snippet data, sets the `user_id` to the current user, sets `forked_from_id = originalSnippet.id`, and resets view metrics.
- **Frontend UI**: 
  - A prominent "Fork" button next to the snippet actions (only visible on public snippets not owned by the current user).
  - Visual attribution/badge on the snippet view showing the fork chain (e.g., "Forked from @alice").
- **Estimated Effort**: ~350 lines of code.

---

### "Recently Accessed" Sidebar Section

**Status**: Planned  
**Description**: Display a "Recently Accessed" list containing the last 5–10 snippets that the user has viewed or edited. This persistent panel dramatically reduces navigation overhead, keeping the user's active work within a single click.

**Example Workflow**:
- A user frequently switches between three distinct snippets while refactoring a project.
- Instead of searching or navigating back to the dashboard each time, they glance at the bottom of the sidebar under **📋 Recently Accessed**.
- They see a list of their recent snippets with relative timestamps (e.g., *"Database Utility (2m ago)"*).
- Clicking any item takes them directly to that snippet.

**Technical Implementation Details**:
- **Database Schema**: Add a nullable `last_accessed_at` timestamp column to the `snippets` table (or implement local storage caching for guest/client-side tracking).
- **Backend API**: 
  - Update `last_accessed_at` whenever a snippet is loaded via the detail route.
  - Optimize the database query to fetch the user's top 5–10 most recently accessed snippets.
- **Frontend UI**:
  - Extend the sidebar layout to include a dedicated expandable section for recently accessed snippets.
  - Use relative time formatting (e.g., "3 min ago") with dynamic updating.
- **Estimated Effort**: ~200 lines of code.

---

### Premium Skeleton Loading 2.0 (Shimmer Effects)

**Status**: Planned  
**Description**: Upgrade current placeholders into a premium, animated skeleton loading system. Implement high-fidelity, polished skeleton cards that perfectly mirror the layout of active components (including language badges, code lines, action buttons, and author credits) with an integrated shimmering animation to significantly reduce perceived load times.

**Example Workflow**:
- A user visits a dashboard or detail page with a slower internet connection.
- Instead of a jarring layout shift or basic loading spinners, they see beautiful, glassmorphic cards with animated, pulsing shimmer paths that exactly reflect the real cards.
- Once the data resolves, the real components animate in seamlessly via transition states.

**Technical Implementation Details**:
- **CSS & Styling**:
  - Implement a highly optimized keyframe animation for a linear-gradient shimmer wave (`background-position` transition).
  - Provide multi-variant skeleton components: `SnippetCardSkeleton` (grid view), `SnippetRowSkeleton` (table view), and `SnippetDetailSkeleton` (full page detail view).
- **Layout & Structure**:
  - Match skeleton dimensions, border radii, and paddings exactly to the live components.
  - Utilize tailwind / modern CSS utilities (e.g. `animate-pulse` or custom linear shimmer overlays) to deliver a fluid, native-like experience.
- **Estimated Effort**: ~200 lines of code.

---

### Visual Feedback for Drag-and-Drop File Upload (GlobalDropzone)

**Status**: Planned  
**Description**: Bring the existing, invisible global dropzone feature to life with immersive visual feedback. When a user drags a file anywhere over the browser window, a beautiful overlay with animated dotted borders, a soft pulsing color glow, and dynamic file metadata emerges to make file imports discoverable and extremely satisfying.

**Example Workflow**:
- A user drags a local file named `utils.ts` from their finder directly into the KoalaSnippets window.
- The viewport instantly dims with a sleek backdrop blur, showing a high-contrast glowing border and a centered drop zone: *“📄 Drop utils.ts here to instantly create a snippet”*.
- Releasing the file triggers a smooth transition into the snippet creation form, pre-filled with the file's name and code content.

**Technical Implementation Details**:
- **CSS & Animation**:
  - Implement a modern keyframe animation for a rotating dashed/dotted border (running ants effect) using a custom `stroke-dasharray` SVG or CSS layout.
  - Implement a pulse animation for the central drop target card.
- **Component & Events**:
  - Enhance the global `dragenter`, `dragover`, and `dragleave` event handlers to reliably track drag states (preventing flickering over child elements).
  - Create a premium `<DragOverlay />` component featuring localized dynamic previews based on file types (e.g. JS/TS, Python, CSS icon styles).
- **Estimated Effort**: ~150 lines of code.

---

### Rich Toast Notification Stack (with Interactive Actions)

**Status**: Planned  
**Description**: Enhance the existing, simple toast notification system into a premium, interactive notification stack. Introduce category-specific styling and icons (Success, Error, Warning, Info), auto-truncation with a "Show More" toggle for long logs, and action hooks (e.g., an instant "Undo" button for destructive actions).

**Example Workflow**:
- A user deletes an older snippet named *"Old Config"*.
- A sleek, red-accented glassmorphic toast slides in from the corner featuring a trashcan icon:  
  *“🗑️ 'Old Config' deleted”* along with a prominent **Undo** button.
- Clicking **Undo** within 5 seconds aborts the deletion and restores the snippet seamlessly; otherwise, the toast fades out.

**Technical Implementation Details**:
- **Toast Engine**:
  - Extend the Toast context/state store with a structured schema supporting custom categories (Success, Error, Warning, Info) and optional actions.
  - Implement a queue/stack system to support stacking multiple active toasts gracefully without overlaps.
- **Frontend UI & Styling**:
  - Design beautifully responsive, glassmorphic toast nodes with category-specific icon mappings and subtle border glows.
  - Build a text-clamp wrapper with a "Show More" link for extensive debug logs or long error messages.
  - Build the inline Action Trigger (e.g., calling an `undo()` Server Action callback).
- **Estimated Effort**: ~200 lines of code.

---

### Context Menu (Right-Click) for SnippetCards

**Status**: Planned  
**Description**: Empower power users with a desktop-grade custom context menu (right-click) on all SnippetCards. Users can instantly trigger high-frequency actions—such as copying the code, duplicating, deleting, favoring, or copying the direct link—without entering the snippet's detail page.

**Example Workflow**:
- A user right-clicks a snippet card on their dashboard.
- A custom, premium glassmorphic context menu flies out at their cursor position with options:  
  *🔍 Open*, *📁 Open in New Tab*, *✏️ Edit*, *📋 Copy Code*, *🔗 Copy Link*, *⭐ Favorite*, *🗑️ Delete*.
- They click *"Copy Code"*. The code is copied directly to their clipboard, and a confirmation toast slides in, while the default native browser menu is cleanly suppressed.

**Technical Implementation Details**:
- **Positioning & Portals**:
  - Implement a highly reusable custom React Context Menu trigger and menu container.
  - Utilize React Portals to render the menu at the root of the document, preventing any clipping or z-index overflow issues from parent containers.
  - Dynamically calculate positioning bounds to prevent the menu from rendering off-screen (viewport edge collisions).
- **Handlers**:
  - Intercept the native `contextmenu` events on `SnippetCard` nodes.
  - Listen globally to click and escape events to automatically dismiss the active context menu.
- **Estimated Effort**: ~250 lines of code.

---

### Snippet "Cover Cards" with Adaptive Gradient Overlays

**Status**: Planned  
**Description**: Bring vibrant visual distinction to the dashboard by introducing optional miniature "cover headers" on SnippetCards. Based on the snippet's language and tags, a premium, soft CSS gradient banner with a subtle language-specific watermark (e.g., Python, TypeScript, HTML) will be generated, allowing users to scan and locate code snippets instantly.

**Example Workflow**:
- A user visits their dashboard.
- TypeScript snippets feature a soft, glassmorphic card header with a deep-blue gradient banner and a semi-transparent, elegant `TS` watermark.
- Python snippets exhibit a warm green-to-yellow gradient.
- This structural visual coding allows them to instantly identify and distinguish their snippets at first glance.

**Technical Implementation Details**:
- **Design System & Mapping**:
  - Build a curated dictionary mapping popular programming languages to custom HSL dual-tone gradients and SVG logo icons.
  - Implement a highly polished dark-mode fallback gradient for unrecognized or generic text formats.
- **Frontend Refactoring**:
  - Redesign the `SnippetCard` header to support an optional image/banner container at the top of the card.
  - Apply glassmorphic overlays (`backdrop-filter`) to text and tags resting on top of the gradient banner, keeping contrast and legibility high.
- **Estimated Effort**: ~200 lines of code.

---

### HTTP Conditional Caching (ETag / 304 Not Modified)

**Status**: Planned  
**Description**: Optimize API performance, save bandwidth, and reduce server CPU usage by implementing conditional HTTP caching using ETags (`Entity Tags`). When querying snippets, the server responds with a unique hash representing the current state of the dataset. Subsequent queries send an `If-None-Match` header, allowing the server to instantly respond with a lightweight `304 Not Modified` if no changes have occurred.

**Example Workflow**:
- A user keeps the dashboard open, which runs background sync or periodic updates (e.g., every 30 seconds).
- The initial load fetches a full response payload of 15 KB (HTTP 200).
- The subsequent 29 checks detect no changes, so the server immediately short-circuits and returns a fast `304 Not Modified` response (~100 bytes), avoiding database serialization and saving significant client/server bandwidth.

**Technical Implementation Details**:
- **ETag Generation**:
  - Generate weak or strong ETags based on the maximum `updated_at` timestamp of the requested dataset or a hash of the content.
- **Middleware & Route Handlers**:
  - Implement a global middleware or lightweight route helper to check the incoming `If-None-Match` request header.
  - If the computed ETag matches the incoming header, immediately abort response body generation and return `304 Not Modified` (standard HTTP spec).
- **Estimated Effort**: ~150 lines of code.

---

### SQLite WAL Checkpoint Automation & Maintenance

**Status**: Planned  
**Description**: Prevent SQLite Write-Ahead Log (`.db-wal`) files from growing uncontrollably and consuming excessive disk space. Implement automated periodic WAL checkpointing (e.g., triggered every 1,000 write operations or every 30 minutes) and couple it directly with the database backup cronjob/scheduler to ensure long-term database performance and self-hosting stability.

**Example Workflow**:
- After bulk importing 500+ snippets or during heavy database updates, the WAL file size swells to 500 MB.
- The automated checkpoint task triggers (either via the scheduled background cron alongside the daily database backup or after the 1,000th write counter threshold).
- SQLite executes a passive or truncate checkpoint (`PRAGMA wal_checkpoint(TRUNCATE)`), transferring all transactions to the main database and shrinking the WAL file safely back to 0 bytes.

**Technical Implementation Details**:
- **Cronjob & Scheduler Integration**:
  - Integrate a `checkpoint` step into the existing database backup cron/scheduler, executing it immediately prior to creating the database snapshot.
  - Implement a simple thread-safe write counter or a time-based scheduler within the server instrumentation/initialization logic.
- **SQLite Operation**:
  - Call `PRAGMA wal_checkpoint(PASSIVE)` or `PRAGMA wal_checkpoint(TRUNCATE)` via the database client interface during checkpoint sweeps.
- **Estimated Effort**: ~80 lines of code.

---

### External Snippet Importer (GitHub Gists, Pastebin & Raw URLs)

**Status**: Planned  
**Description**: Make migrating external collections painless by building a dedicated import wizard. Users can supply public GitHub Gist links, Pastebin URLs, or raw HTTP text links. The system will asynchronously fetch the source, parse its contents, auto-detect the programming language, and populate the snippet title and code automatically.

**Example Workflow**:
- A developer wants to migrate their legacy collections from GitHub Gists.
- They click **"Import"** on the dashboard, opening a clean modal, and paste:  
  `https://gist.github.com/alice/324623789abdc9`
- The system fetches the Gist API, extracts the files, automatically infers the correct file extensions, and creates separate pre-filled snippets (preserving metadata and file names).
- A success toast confirms the migration.

**Technical Implementation Details**:
- **Backend Parser & Integrations**:
  - Implement provider parsers for GitHub Gists API, Pastebin raw endpoints, and a generic raw URL fallback.
  - Implement request validation and outbound rate-limiting/timeouts to prevent Server-Side Request Forgery (SSRF) and avoid resource exhaustion.
- **Frontend UI**:
  - Create a modern, unified importer modal `/import` or card layout with clean progress bar indicators.
  - Display preview cards showing mapped files, allowing users to toggle which files to import or customize titles before final creation.
- **Estimated Effort**: ~400 lines of code.

---

### Mobile Floating Action Button (FAB)

**Status**: Planned  
**Description**: Optimize mobile usability and ergonomics by introducing a floating action button (FAB) in the bottom-right corner for touch viewports. The FAB acts as a thumb-reachable speed-dial for high-priority actions like creating snippets, running quick searches, or triggering file imports on smaller screens.

**Example Workflow**:
- A developer opens KoalaSnippets on their mobile device.
- Instead of stretching their hand to reach the top header, they tap a floating round button with a subtle `+` sign in the bottom-right corner.
- Tapping it triggers a smooth expand animation, revealing quick actions: *✏️ New Snippet*, *📥 Import*, and *📋 Paste from Clipboard*.
- Selecting an option triggers the action immediately.

**Technical Implementation Details**:
- **Mobile-First Layout**:
  - Implement a mobile-only layout container (`block md:hidden` or media queries in vanilla CSS) fixed at `bottom-6 right-6` with a high z-index.
  - Apply backdrop blur (`backdrop-filter`) and smooth transition effects to match our dark/glassmorphic design system.
- **Micro-Animations & Gestures**:
  - Build expansion transitions for the speed-dial sub-buttons using CSS transitions (e.g. scale and fade effects).
  - Add click-outside and touch gestures to auto-collapse the active FAB menu when tapping elsewhere on the screen.
- **Estimated Effort**: ~150 lines of code.

---

### Immersive Visual Empty States (with Active CTAs)

**Status**: Planned  
**Description**: Turn blank dashboard screens and empty search results into highly engaging, productive portals. Instead of simple text descriptions or stark empty spaces when no snippets exist, display curated SVG illustrations or CSS-based abstract art alongside clear, actionable onboarding guides to help new users get started instantly.

**Example Workflow**:
- A new user registers and logs into their dashboard for the first time.
- They are welcomed by a beautiful, glassmorphic card featuring an elegant code-folder SVG illustration:  
  *“No snippets saved yet. Let's build your repository!”*
- Directly below, 3 prominent quick-start buttons are displayed: *✏️ Create New*, *📥 Import from Gists*, and *🌐 Browse Public Snippets*.
- Alternatively, a subtle prompt guides them: *“Or drag and drop files anywhere to upload instantly”*.

**Technical Implementation Details**:
- **Component Design**:
  - Build a highly flexible `<EmptyState />` component that accepts custom SVG illustrations, header text, descriptions, and action callbacks.
  - Implement a secondary compact layout variant for empty search results or blank tag filters.
- **Onboarding Actions**:
  - Include quick-launch buttons pre-bound to current modals (like the new import modal or creation forms).
- **Estimated Effort**: ~150 lines of code.

---

### Local Auto-Save & Draft Recovery

**Status**: Planned  
**Description**: Eliminate accidental data loss and dramatically improve editor quality of life (QoL) by implementing a local auto-save system. While creating or editing a snippet, the editor state will automatically save to the browser's `localStorage` every 3 seconds. If the user accidentally closes the tab, suffers a browser crash, or loses connectivity, their unsaved work can be fully restored upon reopening.

**Example Workflow**:
- A user drafts a complex utility class in the snippet creator.
- After 5 minutes of writing, their browser window crashes or they accidentally hit `Cmd + W`.
- When they reopen KoalaSnippets and navigate to the creation page, a glassmorphic prompt slides in:  
  *“We found an unsaved draft of this snippet. Would you like to restore it?”*
- Clicking **Restore** recovers their full editor state instantly, while discarding or saving the snippet safely clears the local cache.

**Technical Implementation Details**:
- **Custom React Hooks**:
  - Build a custom hook `useLocalStorageDraft(editorKey)` that throttles or debounces input changes to update `localStorage` every 3 seconds.
- **Recovery Dialog & Integration**:
  - Build a modern recovery confirmation component displaying draft metadata (e.g., last auto-saved timestamp, snippet title).
  - Implement a clean cache lifecycle: clear drafts upon successful manual save or explicit discard.
- **Estimated Effort**: ~200 lines of code.

---

### QR Code Sharing & Second-Screen Transfer

**Status**: Planned  
**Description**: Enable instant, frictionless sharing of public or shared snippets to mobile devices and second screens. Introduce a "Share via QR Code" action that generates a high-contrast QR code pointing to the snippet's URL, allowing users to scan and load the snippet instantly on their phone or tablet.

**Example Workflow**:
- A developer is presenting a snippet during a workshop or pair programming session.
- They click the **"Share via QR Code"** button on the snippet view.
- A beautiful glassmorphic modal opens, rendering a dynamic, high-contrast QR code alongside a quick-copy URL field.
- Other team members or the presenter scan the QR code with their mobile devices, instantly opening the snippet page.

**Technical Implementation Details**:
- **QR Generation**:
  - Implement a highly optimized, lightweight client-side QR code generator utilizing a library like `qrcode` or a canvas-based renderer to avoid server-side overhead and keep responses instant.
- **Frontend Modal UI**:
  - Create a reusable `QRCodeModal` component incorporating our premium backdrop blur and animated ease-in transitions.
  - Provide inline controls to copy the plain text link or download the generated QR code as a PNG.
- **Estimated Effort**: ~150 lines of code.

---
*Got ideas? Open an issue or submit a PR!*
