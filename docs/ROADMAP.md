# 🗺️ KoalaSnippets Roadmap

This document tracks both completed and planned features for KoalaSnippets.

---

## ✅ Completed Phases

### Phase 5: Performance & System Resilience
- [x] SQLite WAL Checkpoint Automation (`backup.ts:45`, runs `PRAGMA wal_checkpoint(TRUNCATE)`)
- [x] HTTP Conditional Caching (ETag/304) on all API endpoints (`src/features/core/utils/etag.ts`)
- [x] Static Edge-Caching (ISR) for /stats, /snippets/[id] (generateStaticParams + revalidate)

### Phase 6: Sharing & Onboarding
- [x] Snippet Forking (forked_from_id column, forkSnippet action, Fork button + lineage badge)
- [x] QR Code Sharing (zero-dependency Canvas QR renderer, share modal with copy/download)
- [x] Immersive Empty States (EmptyState component with CSS abstract art + CTA buttons)

### Phase 7: Developer Tools Hub (`/tools`)
- [x] Tools Hub page with card grid navigation
- [x] UUID Generator (bulk v4, plain/SQL/JSON export)
- [x] Password Generator (custom length, char sets, entropy meter)
- [x] Text Diff Checker (LCS-based side-by-side diff)
- [x] Hash Generator (MD5, SHA-1/256/512 via Web Crypto API)
- [x] JSON Formatter (beautify, minify, validate)
- [x] JWT Decoder (header/payload inspection, 100% browser-side)
- [x] Base64 Encoder/Decoder (bidirectional with swap mode)
- All tools run 100% client-side, zero network requests

### Phase 8: Headless Workflows & CLI
- [x] External Snippet Importer (SSRF-protected URL import with preview modal)
- [x] Personal API Keys (api_keys table, Bearer token auth, timing-safe comparison)
- [x] CLI Scripts (`cli/koala.ps1`, `cli/koala.sh` — list, push, pull, search)

### Phase 4 & Prior
- [x] Mobile Floating Action Button (FAB)
- [x] Local Auto-Save & Draft Recovery
- [x] Multi-File Snippets & Revisions
- [x] Hardened WAL-Mode Database
- [x] Grandfather-Father-Son Backups

---

## 🧪 Test Suite

182 unit, integration, CLI, and security tests across 41 suites.
Run with `npm test`. See `tests/README.md` for details.

- [x] Unit tests: API keys, importer security, tools, validations, migration integrity
- [x] Integration tests: Auth guards, visibility matrix, rate limiting, fork validation
- [x] CLI tests: Argument parsing, snippet formatting
- [x] Security tests: SQL injection, XSS, path traversal, prototype pollution, SSRF bypass

---

## 🔮 Future Ideas (Unplanned)

- [ ] Snippet comments / discussions
- [ ] Webhook notifications for forks
- [ ] OAuth / OIDC authentication
- [ ] Snippet version diff viewer
- [ ] Public snippet marketplace / directory
- [ ] Kubernetes deployment manifests
