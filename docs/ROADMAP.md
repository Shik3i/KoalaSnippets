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

---
*Got ideas? Open an issue or submit a PR!*
