---
title: Posting Content to this Site
date: 2026-02-25
tags:
  - posts
  - 11ty
  - indieweb
  - micropub
syndicatedTo:
  - https://bsky.app/profile/joshvogt.bsky.social/post/3mfovaub4542u
  - https://mastodon.social/@joshvogt/116131734911640534
---
## How it Works

This is site is primarily as static site. It is built using [Elevnty](https://11ty.dev) and hosted on [CloudFlare Pages](https://cloudflare.com). This starter is built to use IndieWeb principals. Generally, sites using IndieWeb rely on a number of small services to glue it all together, this starter has most of the plumbing built in using CF Pages Workers. 

The Functions folder has the following functionality built in:

- IndieAuth
- POSSE (syndication)
- MicroPub
- MicroPub Client 
- WebMention discovery and display

The next step is to bake in WebMention support as a CF worker to eliminate reliance on [webmentions.io](https://webmentions.io)

This post was written on my phone using MicroPub and the sites thin UI for authorship in Markdown.
