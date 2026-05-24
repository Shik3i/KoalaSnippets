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

### Context-Aware Command Palette (Smart Actions)

**Status**: Planned  
**Description**: The current `Ctrl+K` command palette is global. It should become context-aware, offering actions based on the user's current view. If the user is viewing a snippet, the first suggestions should be relevant actions for that specific snippet.

**Example Workflow**:
- User presses `Ctrl+K` while viewing a snippet.
- The command palette opens with prioritized options: *Edit Snippet*, *Copy Link*, *Delete Snippet*, or *Move to Collection*.
- Selecting an option executes it immediately without needing to reach for the mouse.

**Technical Implementation Details**:
- **Frontend**: Update the Command Palette component to accept context props (current route/view). Dynamically inject actions based on the active React context.



### Soft-Deletes & Trash Bin

**Status**: Planned  
**Description**: Instead of permanently deleting snippets immediately (hard delete), they should be moved to a "Trash Bin" to prevent accidental data loss. A background job will permanently remove them after a retention period.

**Example Workflow**:
- User accidentally deletes an important snippet.
- User navigates to the "Trash" view via the sidebar.
- User clicks "Restore" to bring the snippet back. 
- Items older than 30 days are automatically purged during the regular backup/cleanup cron job.

**Technical Implementation Details**:
- **Database**: Add a `deleted_at` timestamp column to the `snippets` table. 
- **Backend**: Update existing queries to include `WHERE deleted_at IS NULL`. Add a new route/view for the Trash Bin. Update the background instrumentation script to purge old soft-deleted records.

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

---

### Native View Transitions & Smooth Micro-Animations

**Status**: Planned  
**Description**: Bring the fluid, native feel of desktop applications to the browser. Utilizing the modern native browser View Transitions API, page changes between the snippet list, detail view, and editing modals will morph and animate seamlessly.

**Example Workflow**:
- Clicking a snippet card instantly expands the card element smoothly across the screen into the full detail view, maintaining the layout context of common elements (like the title or tags).

**Technical Implementation Details**:
- **CSS**: Apply unique `view-transition-name` properties to titles, code containers, and tags.
- **Next.js Router**: Implement a lightweight router transition wrapper using standard modern web practices to trigger browser View Transitions on page routing.

---

### Glassmorphic Mini-Terminal (Interaktiver Parameter-Replacer)

**Status**: Planned  
**Description**: Make CLI snippets and Docker commands interactive. A glassmorphic terminal-style UI element will auto-detect parameters like `<HOST_PORT>` or `<DATABASE_URL>` inside a snippet, rendering input fields below the code block.

**Example Workflow**:
- Code Snippet: `docker run -p <HOST_PORT>:80 --name <CONTAINER_NAME> -d nginx`
- UI displays input boxes: `HOST_PORT` (default: 8080) and `CONTAINER_NAME` (default: webserver).
- As the user types, the code inside the terminal visual updates in real-time, ready to be copied.

**Technical Implementation Details**:
- **Parser**: A regex-based frontend utility to parse placeholders matching `<VARIABLE_NAME>` or `{{VARIABLE_NAME}}`.
- **UI Component**: A custom, frosted-glass terminal container with micro-animations and parameter inputs.

---



---
*Got ideas? Open an issue or submit a PR!*
