---
layout: post
title: Setting Up Your IndieWeb Site
date: 2026-02-21
tags:
  - posts
  - documentation
---

This guide walks you through everything you need to do after cloning and deploying this starter. By the end, your site will be able to:

- **Sign you in** to IndieWeb services using your own domain (IndieAuth)
- **Receive interactions** from other websites — likes, replies, reposts (Webmentions)
- **Publish content** from apps on your phone or computer without touching code (Micropub)

## Before You Start

You'll need:

- This site deployed to Cloudflare Pages and connected to a GitHub repository
- A GitHub account
- A Mastodon account (or another social profile that lets you add a website link)

## Step 1: Make the Site Yours

Open `src/_data/meta.js` in your code editor. This is the single file that controls your site's identity. Update these fields:

- **`name`** — your name, displayed on every page
- **`photo`** — path to your avatar image. Replace the file at `src/assets/images/avatar.jpg` with your own photo
- **`note`** — a short bio, one sentence is fine

### Identity Links (relMe)

The `relMe` array is important — it's how IndieAuth verifies that you own this site. Each entry should point to a profile you control on another service:

```js
relMe: [
  { name: 'GitHub', url: 'https://github.com/your-username' },
  { name: 'Mastodon', url: 'https://mastodon.social/@your-handle' }
]
```

These aren't just display links. Your site says "I'm also this person on GitHub and Mastodon," and those services need to say "yes, that's the same person" by linking back to your site. We'll set that up in the next step.

### Social Links

The `social` array is purely for display — these show up on your site but aren't used for authentication. Add whatever profiles you want people to see.

## Step 2: Set Up IndieAuth

IndieAuth lets you sign in to websites and apps using your own domain instead of a username and password. When a service asks "who are you?", you answer with your website URL.

For this to work, you need a two-way link between your site and at least one other profile. Your site already links out (via the `relMe` array you just set up). Now the other service needs to link back.

### Add Your Site to Your GitHub Profile

1. Go to [github.com](https://github.com) and click your avatar in the top-right corner
2. Click **Your profile**
3. Click **Edit profile**
4. In the **Website** field, enter your full site URL (e.g. `https://elevindieweb.pages.dev`)
5. Click **Save**

### Add Your Site to Your Mastodon Profile

1. Log in to your Mastodon instance
2. Go to **Edit profile** (or **Preferences** > **Profile**)
3. Under **Profile metadata**, add a new row with your site URL as the value (the label can be anything, like "Website")
4. Click **Save changes**

Mastodon will verify the link by checking your site for a matching `rel="me"` tag. Once verified, it shows a green checkmark next to the link on your profile.

### Test It

Go to [indieauth.com](https://indieauth.com) and enter your site's URL. It should find your `rel="me"` links and let you sign in through GitHub or Mastodon. If it works, IndieAuth is set up.

GitHub is the most reliable authentication provider here. If you run into trouble with one service, try another.

## Step 3: Set Up Webmentions

Webmentions are how IndieWeb sites talk to each other. When someone likes, replies to, or reposts something on your site, a webmention delivers that interaction to you. Think of them like @mentions, but across the entire web instead of inside a single platform.

Your site is already set up to display webmentions — you just need to tell webmention.io to collect them for you.

1. Go to [webmention.io](https://webmention.io)
2. Enter your site's URL and click **Sign in**
3. This uses IndieAuth (which you just set up), so you'll sign in through GitHub or Mastodon
4. Once signed in, your domain is registered and webmention.io will start collecting mentions

That's it. Your site already has the right `<link>` tag in the `<head>` that tells other sites where to send webmentions. When mentions come in, they'll appear at the bottom of your posts automatically.

### Optional: Build-Time Mentions

By default, webmentions are fetched when someone visits your page (client-side). If you also want them baked into the HTML at build time — so they're visible even without JavaScript — you can add your webmention.io API token:

1. Go to [webmention.io/settings](https://webmention.io/settings)
2. Copy your **API Key**
3. In the Cloudflare dashboard, go to **Workers & Pages** > your project > **Settings** > **Variables and Secrets**
4. Add a new **secret** named `WEBMENTION_IO_TOKEN` and paste your API key as the value
5. Trigger a new deployment — either push a commit or retry the latest deploy. Secrets don't take effect until the next deployment.

This is optional. Client-side fetching works fine on its own.

## Step 4: Configure Environment Variables

Your site needs to know its own URL when it builds. This is set in `wrangler.toml`, a configuration file in the root of your project that Cloudflare reads during deployment.

Open `wrangler.toml` and update the `[vars]` section:

```toml
[vars]
URL = "https://your-site.pages.dev"
SITE_URL = "https://your-site.pages.dev"
ME = "https://your-site.pages.dev/"
GITHUB_REPO_OWNER = "your-github-username"
GITHUB_REPO_NAME = "your-repo-name"
GITHUB_BRANCH = "main"
TOKEN_ENDPOINT = "https://tokens.indieauth.com/token"
```

Here's what each one does:

- **`URL`** — your site's address. Used during the build to generate correct links, feed URLs, and the webmention endpoint
- **`SITE_URL`** — the same address, used by the Micropub function to know where published content will live
- **`ME`** — your identity URL (same domain, with a trailing slash). Used to verify that authentication tokens belong to you
- **`GITHUB_REPO_OWNER`** — your GitHub username (the part after github.com/ in your repo URL)
- **`GITHUB_REPO_NAME`** — the name of your repository on GitHub (the part after your username in the repo URL)
- **`GITHUB_BRANCH`** — the branch your site deploys from, usually `main`
- **`TOKEN_ENDPOINT`** — where Micropub checks authentication tokens. Leave this as the default unless you're running your own IndieAuth server

Commit and push this file. Cloudflare will pick up the new values on the next deploy.

## Step 5: Set Up Micropub (Optional)

Micropub lets you publish to your site from apps — like posting a note from your phone or bookmarking a page from your browser. Instead of writing a markdown file, committing it, and pushing to GitHub, a Micropub app handles all of that for you.

This starter includes a Micropub endpoint that creates content by committing files to your GitHub repository. To make it work, it needs permission to write to your repo.

### Create a GitHub Access Token

A personal access token is like a password that you give to another service so it can act on your behalf. GitHub offers two types:

- **Classic tokens** grant broad access to all of your repositories at once. This is more permission than Micropub needs.
- **Fine-grained tokens** let you limit access to a single repository and choose exactly what the token can do. This is the right choice.

GitHub recommends fine-grained tokens, and so do we. The Micropub endpoint only needs to read and write files in your site's repository — nothing else.

#### Creating the token

1. Go to [github.com](https://github.com) and click your avatar in the top-right corner
2. Click **Settings** (this is your account settings, not a repository's settings)
3. Scroll all the way down the left sidebar and click **Developer settings** — it's the last item
4. Click **Personal access tokens** to expand it, then click **Fine-grained tokens**
5. Click **Generate new token**

#### Configuring the token

1. **Token name** — give it a name you'll recognize, like "ElevIndieWeb Micropub"
2. **Expiration** — pick a duration. When the token expires, Micropub will stop working until you create a new one and update it in Cloudflare. A longer expiration means less maintenance; a shorter one is more secure if the token were ever leaked
3. **Resource owner** — this should be your GitHub account
4. **Repository access** — select **Only select repositories**, then pick your site's repository from the dropdown. This ensures the token can't touch any of your other repos

#### Setting permissions

1. Click **Repository permissions** to expand the list. You'll see many permissions, all set to "No access" by default. You only need to change one:
    - **Contents** — set to **Read and write**

    This gives Micropub permission to read existing files (to check for duplicates) and create new ones (to publish your content). GitHub will automatically enable **Metadata: Read** as well — that's a required base permission for all fine-grained tokens and is harmless.

    Leave everything else as "No access."

#### Generating and copying

1. Click **Generate token**
2. GitHub will show you the token **once**. Copy it immediately and keep it somewhere safe until you've added it to Cloudflare in the next step. If you lose it, you'll need to delete the token and create a new one

### Add the Token to Cloudflare

The token is a secret, so it goes in the Cloudflare dashboard (not in your code):

1. Go to the [Cloudflare dashboard](https://dash.cloudflare.com)
2. Click **Workers & Pages** in the left sidebar
3. Click on your Pages project
4. Go to **Settings** > **Variables and Secrets**
5. Click **Add**
6. Set the type to **Secret**
7. Name it `GITHUB_TOKEN` and paste your token as the value
8. Click **Save**
9. Trigger a new deployment — either push a commit to your repo or go to **Deployments** and click **Retry deployment** on your latest deploy. Secrets don't take effect until the next deployment.

### Test It

1. Go to [quill.p3k.io](https://quill.p3k.io) — a simple Micropub publishing app
2. Sign in with your site's URL (this uses IndieAuth)
3. Try creating a note
4. If it works, a new markdown file will appear in your GitHub repo and your site will redeploy automatically

## Step 6: Sending Webmentions (Optional)

So far your site can *receive* webmentions. But when you write a post that links to someone else's site, you can also *send* a webmention to let them know.

[webmention.app](https://webmention.app) automates this. Give it your RSS feed URL (your site's URL followed by `/rss.xml`) and whenever you publish a new post, it scans for outgoing links and sends webmentions to any site that supports them.

## Checklist

After completing all the steps, verify that everything is working:

- [ ] `src/_data/meta.js` has your name, photo, bio, and profile links
- [ ] At least one `relMe` profile links back to your site
- [ ] You can sign in at [indieauth.com](https://indieauth.com) with your domain
- [ ] You're signed in at [webmention.io](https://webmention.io) and your domain is registered
- [ ] `wrangler.toml` has your site URL, GitHub username, and repo name
- [ ] (Optional) `GITHUB_TOKEN` secret is set in Cloudflare for Micropub
- [ ] (Optional) `WEBMENTION_IO_TOKEN` secret is set in Cloudflare for build-time mentions
