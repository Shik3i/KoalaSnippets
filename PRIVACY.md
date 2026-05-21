# Privacy Policy

## KoalaSnippets - Self-Hosted, Zero-Tracking

KoalaSnippets is designed from the ground up with privacy as a first-class concern. This document explains our privacy philosophy and technical implementation.

## Core Privacy Principles

### 1. Self-Hosted by Design

KoalaSnippets is intended to be hosted on your own infrastructure. You control:
- The server hardware or VPS
- The database file
- The network traffic
- The backup strategy

No data ever leaves your control unless you explicitly make a snippet public.

### 2. Zero External Dependencies (No CDNs)

Most web applications leak user data through third-party CDNs. KoalaSnippets eliminates this entirely:

- **Fonts:** Bundled locally via `@fontsource/*` packages. No Google Fonts requests.
- **Icons:** `lucide-react` is bundled in your JavaScript. No icon CDN requests.
- **Libraries:** All npm packages are bundled into your application. No external script tags.
- **Analytics:** None. Zero tracking scripts. Zero cookies except the essential session cookie.

This means:
- No third party can see who accesses your instance
- No third party can fingerprint your users via CDN requests
- The application works fully offline (after initial load)
- Network requests go ONLY to your own domain

### 3. Minimal Data Collection

The only data stored is what you explicitly provide:
- Username (for authentication)
- Password hash (Argon2id, irreversible)
- Snippets you create (title, description, code, tags)
- Session tokens (hashed, auto-expiring)

We do NOT collect:
- IP addresses
- Browser fingerprints
- Usage analytics
- Error tracking (no Sentry, no LogRocket)
- Any telemetry

### 4. Session Cookie

The only cookie set is an essential session cookie:
- `HttpOnly` - Cannot be read by JavaScript (XSS protection)
- `Secure` - Only sent over HTTPS
- `SameSite=Lax` - Protected against CSRF
- No tracking, no analytics, no third-party cookies

### 5. Visibility Controls

You control exactly who can see each snippet:
- **Private:** Only you can see it. Period.
- **Shared:** Only someone with the exact link can see it. No listing, no discovery.
- **Public:** Listed on your instance's public page. You choose what to make public.

### 6. No Telemetry, No Phone Home

The application:
- Does not check for updates
- Does not send crash reports
- Does not send usage statistics
- Does not communicate with any external server
- Works completely air-gapped if needed

## Technical Implementation

| Privacy Feature | Implementation |
|----------------|----------------|
| No CDN | All assets in `public/` or bundled via npm |
| No tracking | No analytics scripts, no tracking cookies |
| Local fonts | `@fontsource/*` packages, served from `/` |
| Local icons | `lucide-react` as npm dependency |
| Secure sessions | HttpOnly, Secure, SameSite cookies |
| Password security | Argon2id + Salt + Pepper |
| Content Security Policy | Strict CSP blocks all external origins |
| No external APIs | All data from local SQLite database |

## Your Responsibilities

As a self-hosted application, you are responsible for:
- Securing your server (firewall, updates, etc.)
- Using HTTPS (Caddy configuration provided)
- Backing up your SQLite database
- Keeping `AUTH_PEPPER` and `SESSION_SECRET` secure
- Not committing `.env` files to version control

## Changes to This Policy

Since you host the application yourself, you control this policy. Update it as needed for your deployment.
