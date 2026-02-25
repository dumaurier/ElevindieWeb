---
layout: post
title: ElevIndieWeb - About This Starter
date: 2026-02-25
tags:
  - posts
  - documentation
---

An [Eleventy 3.x](https://www.11ty.dev/) IndieWeb starter. Minimal, accessible, self-hosted. No bloated starter kits, no Tailwind, no unnecessary dependencies.

WCAG 2.2 AAA compliant. Deploys to Cloudflare Pages. Everything runs from a single repo.

## Standing on Shoulders

### Eleventy

[Eleventy](https://www.11ty.dev/) is the static site generator. Nunjucks for templating, Markdown for content. The config is modular — filters, collections, shortcodes, and build events each live in their own files under `src/_config/` and get imported by `eleventy.config.js`.

### Eleventy Excellent

This starter cherry-picks project organization patterns from Lene Saile's [Eleventy Excellent](https://github.com/madrilene/eleventy-excellent). Specifically:

- `_data/meta.js` as a JS file (not JSON) so it can read environment variables
- `_data/navigation.js` with `top` and `bottom` arrays for data-driven nav
- `_data/helpers.js` for template-callable utilities (active link state, cache busting)
- Separate `_layouts/` from `_includes/` via Eleventy's `dir.layouts`
- Layout aliases (`layout: base` instead of `layout: base.njk`)
- Split `<head>` into include files
- `body class="{{ layout }}"` for layout-specific CSS
- Modular `_config/` with barrel exports
- OG image generation using SVG templates converted to JPEG via `@11ty/eleventy-img`

We did not take Tailwind, WebC, the design token pipeline, the theme switcher, or any of the CSS implementations. Those are all written from scratch.

### CUBE CSS

The CSS architecture follows [CUBE CSS](https://cube.fyi/) methodology — Composition, Utility, Block, Exception. Native `@layer` ordering controls the cascade:

```css
@layer reset, variables, global, compositions, blocks, utilities;
```

28 source CSS files organized into layers. Compositions (flow, cluster, wrapper, repel, region, grid) handle layout. Blocks handle component-specific styles. Utilities handle single-purpose overrides. All our own CSS — plain, no preprocessors, no frameworks.

### Lightning CSS

[Lightning CSS](https://lightningcss.dev/) bundles the 28 source CSS files into a single minified `style.css` at build time via an `eleventy.after` event. It resolves `@import` statements and `@layer` declarations, replacing the entire PostCSS + plugin chain with zero configuration.

## Content Types

Four content types, each with their own directory, directory data file, collection, landing page, and Atom feed:

- **Posts** (`src/posts/`) — titled articles. Slug derived from title.
- **Notes** (`src/notes/`) — titleless short-form content. Timestamp slugs.
- **Bookmarks** (`src/bookmarks/`) — links with optional commentary. `bookmarkOf` frontmatter field.
- **Replies** (`src/replies/`) — responses to other URLs. `inReplyTo` frontmatter field. Timestamp slugs.

Post type is inferred from frontmatter fields following [IndieWeb post type discovery](https://indieweb.org/post-type-discovery): `in-reply-to` → `bookmark-of` → presence of `name` → note (default).

An `allContent` collection merges all four types sorted by date for the home page and universal feed.

## OG Images

Every content item gets a social preview image. An SVG template (`src/common/og-images.njk`) generates one per item during build, using the DuoTone color palette. A build event converts the SVGs to JPEG via `@11ty/eleventy-img`. No headless browser needed.

Each image includes a content type pill (Post, Note, Bookmark, Reply), the title or a content preview for titleless entries, the date, site name, and author.

## IndieWeb

### Microformats2

The site uses [microformats2](https://microformats.org/) markup throughout:

- **h-card** — identity, in the footer on every page. Driven by `_data/meta.js`.
- **h-entry** — wraps individual content items. Split into three partials:
  - `h-entry.njk` — wrapper, content, date, permalink, author
  - `h-entry-meta.njk` — title, summary, tags, bookmark-of, in-reply-to
  - `h-entry-interactions.njk` — received webmentions
- **h-feed** — wraps any collection of h-entries. Content-type agnostic.

### IndieAuth

Self-hosted. No external auth service. The authorization and token endpoints run as Cloudflare Functions in the same repo.

- Password login with constant-time comparison (HMAC equality trick — CF Workers don't have `timingSafeEqual`)
- PKCE mandatory (S256 only)
- JWT access tokens signed with HMAC-SHA256 via `crypto.subtle` (30-day expiry, no npm dependencies)
- Token introspection and revocation (revocation uses a KV blocklist with TTL matching remaining token lifetime)
- Authorization codes stored in KV with 10-minute TTL
- Consent page is self-contained HTML with the DuoTone palette
- Metadata endpoint at `/indieauth-metadata` for modern spec discovery

Your `<head>` advertises the endpoints and `rel="me"` links for identity verification:

```html
<link rel="indieauth-metadata" href="/indieauth-metadata">
<link rel="authorization_endpoint" href="/auth">
<link rel="token_endpoint" href="/token">
```

### Micropub

A full [Micropub](https://micropub.spec.indieweb.org/) server and a built-in posting client.

**Server:** The handler at `/micropub` accepts JSON Micropub requests, creates the corresponding Markdown file with frontmatter via the GitHub API, and returns the new URL. Supports create, update, and delete across all four content types. Scoped tokens control access (`create`, `update`, `delete`). The `?q=config` query returns available syndication targets.

**Posting client:** A built-in admin page at `/admin` for creating content directly. Client-side PKCE auth against the self-hosted IndieAuth endpoints. Four post types (note, post, bookmark, reply) with dynamic field visibility. Markdown toolbar (Bold, Italic, Link, H2) with keyboard shortcuts. Syndication target checkboxes fetched from the Micropub config endpoint. Links to the site stylesheet for consistent design — only admin-specific CSS is inlined.

Compatible with any standard Micropub client (tested with [Sparkles](https://sparkles.sploot.com)).

### Webmentions

Cross-site interactions via [webmention.io](https://webmention.io).

**Build-time:** `_data/webmentions.js` fetches mentions from the webmention.io API during build (cached 1 hour). Requires `WEBMENTION_IO_TOKEN`. Gracefully skips if not set.

**Client-side:** `assets/js/webmentions.js` fetches live mentions on page load to catch anything received between builds.

**Display:** Mentions appear at the bottom of content pages, grouped by type — likes and reposts as facepiles, bookmarks as a name list, replies with author, date, and content.

**Sending:** Configure [webmention.app](https://webmention.app) with your RSS feed to send webmentions automatically on publish.

### Syndication (POSSE)

[POSSE](https://indieweb.org/POSSE) — Publish on your Own Site, Syndicate Elsewhere. Content is published to the site first, then cross-posted to other platforms.

Supported targets:

- **Bluesky** — AT Protocol, raw fetch (no SDK). Handles facets for clickable links using UTF-8 byte offsets.
- **Mastodon** — Mastodon API, raw fetch.

Two syndication paths:

1. **Micropub** — select syndication targets via `mp-syndicate-to` checkboxes in the admin page or any Micropub client. Runs in the background via `waitUntil` after a successful create.
2. **Webhook** — a GitHub push webhook processes newly added `.md` files with `syndicate: true` in frontmatter. Validates HMAC-SHA256 signatures.

Both paths wait for the post URL to go live before syndicating (polls until the CF Pages build finishes). Syndicated URLs are written back to the file's frontmatter as a `syndicatedTo` array.

## Cloudflare

### Pages

The site deploys to [Cloudflare Pages](https://pages.cloudflare.com/). Eleventy builds into `_site/`, which Pages serves as static files. GitHub auto-deploys on push.

### Functions

All server-side logic runs as [Cloudflare Pages Functions](https://developers.cloudflare.com/pages/functions/) — TypeScript files in the `functions/` directory that Cloudflare maps to URL routes automatically.

Endpoints:

- `/auth` — IndieAuth authorization (consent page + code exchange)
- `/token` — token exchange, introspection, revocation
- `/indieauth-metadata` — IndieAuth metadata document
- `/micropub` — Micropub handler (create, update, delete, query)
- `/webhook` — GitHub push webhook for direct-commit syndication
- `/admin` — posting client

KV namespace (`INDIEAUTH_KV`) stores authorization codes and revoked token JTIs. Content is managed via the GitHub API — no database, the repo is the source of truth.

## Configuration

Two configuration surfaces.

### `src/_data/meta.js`

Site-level config used by Eleventy at build time:

- Site name, description, language
- Author name, email, photo, bio
- `rel="me"` links for identity verification
- IndieAuth, Micropub, and webmention endpoint paths

Navigation lives in `src/_data/navigation.js` with `top` (header) and `bottom` (footer) arrays.

### `wrangler.toml`

Cloudflare deployment config. Non-secret environment variables go in the `[vars]` section:

- `URL` / `SITE_URL` — your site's canonical URL
- `ME` — your IndieWeb identity URL
- `GITHUB_REPO_OWNER` / `GITHUB_REPO_NAME` / `GITHUB_BRANCH` — where content lives
- `TOKEN_ENDPOINT` — full URL to your token endpoint
- `BLUESKY_HANDLE` / `MASTODON_INSTANCE_URL` — syndication targets (optional)

Secrets are set via the Cloudflare dashboard (Workers & Pages > Settings > Variables and Secrets):

- `GITHUB_TOKEN` — GitHub personal access token with repo scope
- `AUTH_PASSWORD` — password for IndieAuth login
- `JWT_SECRET` — random string for JWT signing
- `BLUESKY_APP_PASSWORD` — Bluesky app password (optional)
- `MASTODON_ACCESS_TOKEN` — Mastodon access token (optional)
- `GITHUB_WEBHOOK_SECRET` — shared secret for push webhook (optional)
- `WEBMENTION_IO_TOKEN` — webmention.io API token (optional)
