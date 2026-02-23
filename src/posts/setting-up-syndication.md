---
layout: post
title: Setting Up Syndication (POSSE)
date: 2026-02-23
tags:
  - posts
  - documentation
---

This guide walks you through setting up syndication — automatically cross-posting your content to Bluesky and Mastodon when you publish. In IndieWeb terms, this is called [POSSE](https://indieweb.org/POSSE): Publish on your Own Site, Syndicate Elsewhere.

Your site is the canonical source. Syndication copies go out to the platforms where people will actually see them, with a link back to the original on your site.

## How It Works

There are two ways content gets syndicated:

1. **Via Micropub** — when you publish from an app like Quill, you choose which platforms to syndicate to using checkboxes. The syndication happens automatically after your content is committed to GitHub.

2. **Via direct commit** — when you write a markdown file and push it to GitHub yourself, add `syndicate: true` to the frontmatter. A webhook picks up the new file and syndicates it.

Both paths use the same underlying syndication code. Both are optional — if you don't configure any platform tokens, the feature stays invisible.

## Before You Start

You'll need:

- This site deployed to Cloudflare Pages (see [Setting Up Your IndieWeb Site](/posts/setting-up-your-indieweb-site/))
- A Bluesky account (if you want to syndicate there)
- A Mastodon account (if you want to syndicate there)
- Access to the [Cloudflare dashboard](https://dash.cloudflare.com) for your project

You can set up one platform or both. Each one is independent.

## Setting Up Bluesky

Bluesky uses app passwords to let other services post on your behalf. An app password is a separate credential from your main login — if you ever need to revoke access, you can delete the app password without changing your account password.

### Create a Bluesky App Password

1. Log in to [bsky.app](https://bsky.app)
2. Click on **Settings**
3. Select **Privacy and Security** and click **App passwords**
4. Click **Add app password**
5. Give it a name you'll recognize, like "IndieWeb Site"
6. Click **Create app password**
7. Bluesky will show you the password once — it looks like `xxxx-xxxx-xxxx-xxxx`. Copy it immediately. You won't be able to see it again. If you lose it, delete the app password and create a new one.

### Add Bluesky Config

Two pieces of configuration are needed: your handle (not a secret, goes in your code) and the app password (a secret, goes in the Cloudflare dashboard).

#### wrangler.toml

Open `wrangler.toml` and uncomment the Bluesky lines in the `[vars]` section:

```toml
BLUESKY_HANDLE = "yourname.bsky.social"
```

Replace `yourname.bsky.social` with your actual Bluesky handle — without the `@` sign. Just the domain-style handle. If you're using a custom domain as your handle, use that instead (e.g. `example.com`).

The `BLUESKY_PDS_URL` line can stay commented out — it defaults to `https://bsky.social`, which is correct unless you're running your own Personal Data Server.

#### Cloudflare Dashboard

1. Go to the [Cloudflare dashboard](https://dash.cloudflare.com)
2. Click **Workers & Pages** in the left sidebar
3. Click on your Pages project
4. Go to **Settings** > **Variables and Secrets**
5. Click **Add**
6. Set the type to **Secret**
7. Name it `BLUESKY_APP_PASSWORD` and paste the app password you copied earlier
8. Click **Save**
9. Trigger a new deployment — push a commit or retry the latest deploy. Secrets don't take effect until the next deployment.

## Setting Up Mastodon

Mastodon uses access tokens to grant posting permission. You'll create an application on your Mastodon instance and use its token.

### Create a Mastodon Application

1. Log in to your Mastodon instance (e.g. mastodon.social)
2. Go to **Preferences** (click your avatar, then **Preferences** or **Settings**)
3. In the left sidebar under **Development**, click **New application**
4. Fill in:
   - **Application name** — something like "IndieWeb Site"
   - **Scopes** — uncheck everything except **`write:statuses`**. This is the minimum permission needed. Your site only needs to post statuses — it doesn't need to read your timeline, follow people, or access your account.
5. Click **Submit**
6. Click on the application name to see its details
7. You'll see three values: **Client key**, **Client secret**, and **Your access token**. You only need **Your access token** — the other two are for OAuth flows that we don't use. Copy the access token.

### Add Mastodon Config

Same pattern as Bluesky: instance URL in your code, access token in the dashboard.

#### wrangler.toml

Open `wrangler.toml` and uncomment the Mastodon line in the `[vars]` section:

```toml
MASTODON_INSTANCE_URL = "https://mastodon.social"
```

This is just the base URL of your instance — not your profile URL and not your handle. No `@username` path, just the domain. The access token already identifies your account, so the instance URL only tells the code *where* to send the request.

Replace `mastodon.social` with whatever instance you're on (e.g. `hachyderm.io`, `fosstodon.org`, etc.).

#### Cloudflare Dashboard

1. Go to the [Cloudflare dashboard](https://dash.cloudflare.com)
2. Click **Workers & Pages** > your project > **Settings** > **Variables and Secrets**
3. Click **Add**
4. Set the type to **Secret**
5. Name it `MASTODON_ACCESS_TOKEN` and paste the access token you copied earlier
6. Click **Save**
7. Trigger a new deployment

## Setting Up the Webhook (Optional)

The webhook enables syndication for content you create by writing markdown files and pushing to GitHub — the "direct commit" path. If you only publish through Micropub apps, you can skip this.

### Create a Webhook Secret

The webhook secret is a shared password between GitHub and your site. It proves that incoming webhook requests are actually from GitHub and not someone else. Pick any random string — the longer and more random, the better.

An easy way to generate one:

1. Go to [generate.plus/en/base64](https://generate.plus/en/base64) and generate a random string
2. Or run `openssl rand -base64 32` in your terminal

Copy whatever you generate. You'll need it in two places.

### Add the Secret to Cloudflare

1. Go to the [Cloudflare dashboard](https://dash.cloudflare.com)
2. Click **Workers & Pages** > your project > **Settings** > **Variables and Secrets**
3. Click **Add**
4. Set the type to **Secret**
5. Name it `GITHUB_WEBHOOK_SECRET` and paste your random string
6. Click **Save**
7. Trigger a new deployment

### Configure the GitHub Webhook

1. Go to your repository on [github.com](https://github.com)
2. Click **Settings** (the repository settings, not your account settings)
3. Click **Webhooks** in the left sidebar
4. Click **Add webhook**
5. Fill in:
   - **Payload URL** — `https://your-site.pages.dev/webhook` (replace with your actual site URL)
   - **Content type** — select **application/json**
   - **Secret** — paste the same random string you added to Cloudflare
   - **Which events?** — select **Just the push event**
6. Click **Add webhook**

GitHub will send a ping to verify the connection. If your site is deployed with the secret in place, you should see a green checkmark next to the webhook.

### Using the Webhook

When you create a new markdown file and want it syndicated, add `syndicate: true` to the frontmatter:

```yaml
---
title: My New Post
date: 2026-02-23
tags:
  - posts
syndicate: true
---

Your post content here.
```

Push the commit. The webhook will pick up the new file, see `syndicate: true`, and post to whichever platforms you've configured. After syndication succeeds, the file will be updated with a `syndicatedTo` array containing the URLs of the cross-posted copies.

If you omit `syndicate: true` (or set it to `false`), the file is published to your site only. No cross-posting happens.

## Test It

### Micropub Path

1. Go to [quill.p3k.io](https://quill.p3k.io) and sign in with your site URL
2. You should see checkboxes for Bluesky and/or Mastodon (whichever you configured)
3. Write a test note, check the syndication boxes, and publish
4. Check Bluesky and Mastodon — your note should appear on both, with a link back to your site

### Direct Commit Path

1. Create a test note in `src/notes/` with `syndicate: true` in the frontmatter
2. Commit and push to your main branch
3. Check Bluesky and Mastodon after a few seconds

If the checkboxes don't appear in Quill, the most likely cause is that your secrets haven't taken effect yet. Make sure you triggered a new deployment after adding them.

## How Syndicated Posts Look

Your content is formatted differently depending on the type:

- **Posts (articles):** The title in quotes, followed by the URL. e.g. `"My New Post"` with a link to `https://your-site.pages.dev/posts/my-new-post/`
- **Notes:** The note content, followed by the URL
- **Bookmarks:** `Bookmarked: Title` with the bookmarked URL, followed by a link to the bookmark page on your site

## Checklist

After completing the steps above, verify that everything is working:

- [ ] (Bluesky) `BLUESKY_HANDLE` is set in `wrangler.toml`
- [ ] (Bluesky) `BLUESKY_APP_PASSWORD` secret is set in Cloudflare
- [ ] (Mastodon) `MASTODON_INSTANCE_URL` is set in `wrangler.toml`
- [ ] (Mastodon) `MASTODON_ACCESS_TOKEN` secret is set in Cloudflare
- [ ] (Webhook) `GITHUB_WEBHOOK_SECRET` secret is set in Cloudflare
- [ ] (Webhook) Webhook is configured in GitHub repo settings pointing to `/webhook`
- [ ] Quill shows syndication checkboxes when you sign in
- [ ] A test post appears on your configured platforms
