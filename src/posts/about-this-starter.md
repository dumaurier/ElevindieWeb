---
layout: post
title: About This Starter
date: 2026-02-18
tags:
  - posts
  - documentation
---

## What This Is

An Eleventy 3.x IndieWeb starter built to be minimal, accessible, and easy to customize. No bloated starter kits, no Tailwind, no unnecessary dependencies.

## Goals

- Full IndieWeb support out of the box
- WCAG 2.2 AAA compliance
- Easy for anyone to clone and make their own

## Tech Stack

- **Eleventy 3.x** (latest stable)
- **Nunjucks & Liquid** templating
- **Plain CSS** with `@layer` ordering and CUBE CSS methodology
- **npm** for package management

## IndieWeb Features

### Microformats2

The starter uses microformats2 markup throughout:

- **h-card** — your identity, rendered in the footer on every page via `partials/h-card.njk`. Driven by `_data/meta.js` (name, photo, bio, email, rel-me links).
- **h-entry** — wraps individual content items. Split into three partials for maintainability:
  - `partials/h-entry.njk` — the wrapper plus core properties (content, date, permalink, author)
  - `partials/h-entry-meta.njk` — optional properties (title, summary, tags)
  - `partials/h-entry-interactions.njk` — received webmentions (likes, reposts, replies, bookmarks)
- **h-feed** — wraps a collection of h-entries via `partials/h-feed.njk`. Content-type agnostic — works with any collection you pass it.

Post types are inferred from which properties are present in front matter, not declared explicitly. A post with a title is an article; without one it's a note. Add `photo` and it's a photo post. This follows the IndieWeb post type discovery algorithm.

### IndieAuth

Authentication via your own domain. The starter defaults to `indieauth.com` endpoints (configurable in `_data/meta.js`). Your `<head>` includes:

- `authorization_endpoint` — where apps send users to sign in
- `token_endpoint` — for apps that need access tokens (like Micropub clients)
- `rel="me"` links — in both the `<head>` and the h-card for maximum parser compatibility

IndieAuth verifies your identity by checking that your `rel="me"` links (GitHub, Mastodon, etc.) link back to your site.

### Webmentions

Receiving and displaying cross-site interactions, powered by webmention.io.

**Receiving — build-time:** The `_data/webmentions.js` file fetches all mentions from webmention.io's API during build (cached for 1 hour). Requires a `WEBMENTION_IO_TOKEN` environment variable. Gracefully skips if not set.

**Receiving — client-side:** The `assets/js/webmentions.js` script fetches live mentions on page load using the public API. This shows mentions received between builds without requiring JS for the build-time content.

**Display:** Received mentions appear at the bottom of any page using the `post` layout, grouped by type:
- Likes — shown as a facepile (avatars and names)
- Reposts — shown as a facepile
- Bookmarks — shown as a list of names
- Replies — shown with author, date, and content

**Sending:** Configure [webmention.app](https://webmention.app) with your RSS feed to automatically send webmentions when you publish.

## Project Structure

All source files live in `src/`:

- `_layouts/` — base layout and thin content-type layouts (e.g. `post.njk` extends `base.njk` and wraps content in h-entry markup)
- `_includes/head/` — split `<head>` partials (CSS, meta info, IndieWeb endpoints)
- `_includes/partials/` — reusable components (header, footer, h-card, h-entry, h-feed, webmentions)
- `_data/` — global data files:
  - `meta.js` — site config, author info, IndieAuth and webmention endpoints
  - `navigation.js` — top/bottom nav arrays
  - `helpers.js` — template-callable utilities (active link state, cache busting)
  - `webmentions.js` — build-time webmention fetch
- `_config/` — modular Eleventy config (filters, collections, shortcodes, events in separate files)
- `common/` — build-time generators (OG image SVGs)
- `assets/` — static files (CSS, JS, images, fonts, SVG, OG images)

## CSS Architecture

Plain CSS using native `@layer` for cascade control and the CUBE CSS methodology:

```
@layer reset, variables, global, compositions, utilities;
```

Composition files (flow, cluster, wrapper, repel, region) are blank stubs ready to be filled in. Per-page CSS is supported via Eleventy's `addBundle('css')`.

## Configuration

All site-specific values live in `_data/meta.js`:

- Site name, description, language
- Author name, email, photo, bio
- `rel="me"` links for identity verification
- IndieAuth endpoints (default: indieauth.com)
- Webmention endpoint (default: webmention.io)

Navigation is in `_data/navigation.js` with `top` (header) and `bottom` (footer) arrays.

## OG Images

Each post automatically gets a social preview image. An SVG template (`common/og-images.njk`) generates one per post during build, then `svg-to-jpeg` converts them. No headless browser needed.

## Getting Started

1. Clone this repo
2. Run `npm install`
3. Edit `src/_data/meta.js` with your info
4. Edit `src/_data/navigation.js` with your nav links
5. Run `npm start` for the dev server
6. Create posts in `src/posts/`

For webmentions, set `WEBMENTION_IO_TOKEN` in your environment and sign up at [webmention.io](https://webmention.io).

For webmention sending, set up [webmention.app](https://webmention.app) with your RSS feed URL.

## What We Took from Eleventy Excellent

This starter cherry-picks conventions from Lene Saile's [Eleventy Excellent](https://github.com/madrilene/eleventy-excellent) — specifically the project organization patterns, not the styling or plugin choices.

### Adopted

- **`_data/meta.js`** as a JS file (not JSON) so it can read environment variables — single source of truth for site config
- **`_data/navigation.js`** with `top` and `bottom` arrays for data-driven navigation
- **`_data/helpers.js`** for template-callable utility functions (`getLinkActiveState` for aria-current on nav links, `random` for cache-busting hashes)
- **Separate `_layouts/` directory** from `_includes/` via Eleventy's `dir.layouts` config
- **Layout aliases** so front matter uses `layout: base` instead of `layout: base.njk`
- **Split `<head>` into include files** for maintainability
- **`body class="{{ layout }}"` pattern** for layout-specific CSS targeting
- **CUBE CSS methodology** (flow, cluster, wrapper, repel, region compositions) — but with our own CSS, not Excellent's implementation
- **CSS `@layer` ordering** for explicit cascade control
- **Per-page CSS** via Eleventy's `addBundle('css', { hoist: true })`
- **Modular `_config/` directory** with filters, collections, shortcodes, and events in separate files with barrel exports
- **YAML data extension** for mixed data formats in `_data/`
- **OG image generation** using SVG templates converted to JPEG via `@11ty/eleventy-img` (no headless browser)

### Deliberately Left Out

- Tailwind CSS and the design token → Tailwind pipeline
- WebC components
- The `clamp-generator.js` and `tokens-to-tailwind.js` utilities
- Theme switcher, easter eggs, GitHub data fetching
- Any plugins that replicate default Eleventy functionality
- The actual CSS in Excellent's composition files
