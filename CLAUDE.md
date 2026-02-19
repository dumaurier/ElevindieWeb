# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

An 11ty IndieWeb starter — minimal, accessible, and easy to customize. Built lean from scratch (no bloated starter kits).

### Goals

- IndieWeb Principals
- WCAG 2.2 AAA Compliance
- Easily customizable

## Tech Stack

- **Static site generator:** Eleventy 3.x (latest stable)
- **Templating:** Nunjucks & Liquid
- **Styling:** Plain CSS (no Tailwind, no preprocessors)
- **Package manager:** npm
- **Webmentions:** webmention.io for receiving

## IndieWeb Features

- Microformats2 (h-card, h-entry, h-feed)
- Webmentions (sending/receiving via webmention.io)
- IndieAuth
- Micropub

## Project Structure

```text
src/
  _layouts/     base layout (separate from includes)
  _includes/
    head/       split <head> partials (css.njk, meta-info.njk)
    partials/   reusable components (header.njk, footer.njk)
  _data/        global data (meta.js, navigation.js, helpers.js)
  _config/      modular eleventy config
    filters/    individual filter modules
    events/     build events (svg-to-jpeg)
  common/       build-time generators (og-images.njk)
  pages/        static pages
  posts/        blog posts
  assets/
    css/        stylesheets (@layer ordering, CUBE CSS compositions)
    js/         scripts
    svg/        SVG files
    images/     images
    fonts/      web fonts
    og-images/  generated OG preview images
```

## Build Commands

- `npm start` — dev server
- `npm run build` — production build

## Conventions

- **Data files:** `_data/meta.js` for site config, `_data/navigation.js` for nav (top/bottom arrays), `_data/helpers.js` for template-callable utilities
- **Layout aliases:** front matter uses `layout: base` (not `layout: base.njk`)
- **Body class:** `<body class="{{ layout }}">` for layout-specific CSS targeting
- **CSS architecture:** CUBE CSS methodology with `@layer` ordering (reset → variables → global → compositions → utilities)
- **Per-page CSS:** use `addBundle('css')` for page-specific styles
- **OG images:** SVG templates in `common/og-images.njk`, converted to JPEG via `svg-to-jpeg` build event
- **YAML support:** `.yaml` files work in `_data/` alongside JS and JSON
- **Config modularity:** filters, collections, shortcodes, and events each in `_config/` subdirectories

## Development Best Practices

- Never assume, guess or just try
- All HTML must be semantic and WCAG 2.2 AAA compliant
- The entire site must be WCAG 2.2 AAA compliant
- Ask questions as much as possible, this is a collaboration
- This project will rely on IndieWeb principals to guide development
- Keep it lean — no unnecessary dependencies or bloat
- Plain CSS only — no utility frameworks
