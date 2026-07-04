---
title: IndieWeb MicroPub and POSSE Changes
date: 2026-07-04T11:44:27.810Z
tags:
  - posts
  - indieweb
  - micropub. eleventy
  - posse
syndicatedTo:
  - https://bsky.app/profile/joshvogt.bsky.social/post/3mpsyco2pds2e
  - https://mastodon.social/@joshvogt/116861533157311478
---
I've been using this starter on another project and found some things I wanted to fix. There was a timeout issue on POSSE syndication and I added a small enhancement to posts/notes/bookmarks syndication.

## POSSE Syndication Timeout

The initial version of syndication tried to wait for the new URL from the IndieWeb deployment to go live before it pushed an update to Mastodon and BlueSky. I did this to avoid having a temporarily dead link posted to social media. However, because this project is hosted on CloudFlare's free tier, there was a hard 30 second timeout that silently killed the process if the deployment took too long. Now, if the IndieWeb deployment isn't ready after 15000ms it publishes the new URLs to Mastodon and BlueSky anyways. The tradeoff is that if someone is really eager and clicks on the update on social media, they may get a 404. In testing, there is about 5-10 second window during which the new URL back to IndieWeb site won't yet be live. If this is used on a paid tier of CloudFlare, the POLL_MAX value can go back to 120000ms.

## POSSE Syndication Hashtags

There is a new section in 'src/_data/meta.js' called 'socialWhitelist' that had define whitelisted terms and if a tag on a post matches one of the whitelisted terms, during syndication that hashtag will be added to Mastodon and BlueSky posts. Currently, the repo has a list of terms related to IndieWeb stuff but could easily be replaced with terms related to cheese, animal husbandry, vintage toasters...whatever. 

Note: I messed up and forgot which branch MicroPub wrote to. So, it didn't show up. Fixing that now.
