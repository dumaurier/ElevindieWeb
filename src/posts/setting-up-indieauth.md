---
layout: post
title: Setting Up Self-Hosted IndieAuth
date: 2026-02-24
tags:
  - posts
  - documentation
---

This guide walks you through setting up self-hosted IndieAuth — your own authorization and token endpoints, running as Cloudflare Pages Functions alongside the rest of your site. When you're done, signing into Micropub apps like Sparkles or Quill will go through your site instead of through indieauth.com.

## What IndieAuth Does

IndieAuth is how you prove you own your website. When a Micropub app asks "who are you?", you give it your site URL. The app then talks to your authorization endpoint to verify your identity and get permission to publish on your behalf.

Previously, this starter delegated that job to [indieauth.com](https://indieauth.com) — an external service that handled the login flow and issued tokens. With self-hosted IndieAuth, your site handles all of that itself. The login flow is now:

1. You enter your site URL in a Micropub app
2. The app discovers your authorization endpoint by reading link tags in your HTML
3. The app redirects you to your own `/auth` page — a login form served by your site
4. You enter your password and approve the requested permissions
5. Your site generates an authorization code and sends it back to the app
6. The app exchanges that code for an access token at your `/token` endpoint
7. The app uses that token to publish content via Micropub

Everything stays on your domain. No external service involved.

## Before You Start

You'll need:

- This site deployed to Cloudflare Pages (see [Setting Up Your IndieWeb Site](/posts/setting-up-your-indieweb-site/))
- Access to the [Cloudflare dashboard](https://dash.cloudflare.com) for your project
- A terminal where you can run `openssl` (macOS and Linux have this built in)

## Step 1: Create the KV Namespace

IndieAuth needs a small key-value store to hold temporary authorization codes (they last 10 minutes) and to track revoked tokens. Cloudflare KV provides this.

1. Open your terminal
2. From the project directory, run:

```bash
npx wrangler kv namespace create INDIEAUTH_KV
```

3. Wrangler will output something like:

```
🌀 Creating namespace with title "11ndtyweb-INDIEAUTH_KV"
✨ Success!
Add the following to your configuration file:
{ binding = "INDIEAUTH_KV", id = "abc123def456..." }
```

4. Open `wrangler.toml` and find the `[[kv_namespaces]]` section. Replace the placeholder ID with the one from the output:

```toml
[[kv_namespaces]]
binding = "INDIEAUTH_KV"
id = "abc123def456..."
```

The binding name `INDIEAUTH_KV` is what the code uses to access the store. Don't change it — just paste in your ID.

## Step 2: Generate a JWT Signing Key

Access tokens are JWTs (JSON Web Tokens) — signed strings that encode your identity and permissions. The signing key is a random secret that only your site knows. Anyone with this key could forge valid tokens, so it's stored as an encrypted secret in Cloudflare.

Generate one:

```bash
openssl rand -hex 32
```

This outputs 64 hex characters — a 256-bit random key. Copy the output.

### Add it to Cloudflare

1. Go to the [Cloudflare dashboard](https://dash.cloudflare.com)
2. Click **Workers & Pages** in the left sidebar
3. Click on your Pages project
4. Go to **Settings** > **Variables and Secrets**
5. Click **Add**
6. Set the type to **Secret**
7. Name it `JWT_SECRET` and paste the key you generated
8. Click **Save**

## Step 3: Set Your Login Password

This is the password you'll type when a Micropub app redirects you to your site's login page. Choose something strong — it's the only thing standing between the internet and your publishing endpoint.

### Add it to Cloudflare

1. In the same **Variables and Secrets** page
2. Click **Add**
3. Set the type to **Secret**
4. Name it `AUTH_PASSWORD` and enter your chosen password
5. Click **Save**

This password is stored encrypted by Cloudflare. It never appears in your code, your repo, or your build logs. The only place it exists in plaintext is in the worker's memory during the fraction of a second it takes to verify your login.

## Step 4: Deploy

Secrets don't take effect until the next deployment. Either push a commit to your repository or go to **Deployments** in the Cloudflare dashboard and retry the latest deploy.

## Test It

### Check Discovery

Open your site in a browser and view the page source (right-click > View Page Source). Look for these three lines in the `<head>`:

```html
<link rel="indieauth-metadata" href="/indieauth-metadata">
<link rel="authorization_endpoint" href="/auth">
<link rel="token_endpoint" href="/token">
```

These tell Micropub apps where to find your IndieAuth endpoints. If you see them pointing to `/auth` and `/token` (not `indieauth.com`), discovery is working.

### Check the Metadata Endpoint

Visit `https://your-site.pages.dev/indieauth-metadata` in your browser. You should see a JSON document listing your endpoints, supported scopes, and other configuration. This is how modern IndieAuth clients discover your setup.

### Sign In with a Micropub App

1. Go to [sparkles.sploot.com](https://sparkles.sploot.com) or [quill.p3k.io](https://quill.p3k.io)
2. Enter your site URL and start the sign-in flow
3. You should be redirected to your site's login page — a form with your DuoTone color scheme showing the app's URL and the permissions it's requesting
4. Enter your password and click **Approve**
5. You should be redirected back to the app, now signed in
6. Try publishing a test note to confirm the token works end-to-end

### What If Something Goes Wrong

- **"IndieAuth not configured" error** — the secrets haven't taken effect yet. Make sure you triggered a new deployment after adding `AUTH_PASSWORD` and `JWT_SECRET`.
- **App can't find endpoints** — check that `src/_data/meta.js` has the self-hosted endpoints (`/auth`, `/token`, `/indieauth-metadata`) and not the old `indieauth.com` URLs.
- **CF error 1101** — the function threw an exception. Check real-time logs in the Cloudflare dashboard: **Workers & Pages** > your project > **Functions** tab > **Real-time Logs**. The error message will tell you what went wrong.
- **"Incorrect password"** — the consent page re-renders with an error. Check that you typed the password correctly. If you've forgotten it, set a new `AUTH_PASSWORD` secret in the dashboard and redeploy.
- **App gets `error=access_denied`** — you clicked **Deny** on the consent page. Try again and click **Approve**.

## How It Works Under the Hood

### Endpoints

Your site now serves three new endpoints as Cloudflare Pages Functions:

- **`/auth`** — the authorization endpoint. Shows the login form (GET) and processes your approval (POST).
- **`/token`** — the token endpoint. Exchanges authorization codes for access tokens. Also handles token introspection (checking if a token is valid) and revocation.
- **`/indieauth-metadata`** — a JSON document that describes your IndieAuth configuration. Modern clients use this for discovery instead of parsing HTML link tags.

### Security

- **PKCE** (Proof Key for Code Exchange) is mandatory. Every authorization request must include a code challenge. This prevents authorization code interception attacks — even if someone intercepts the code, they can't exchange it without the original verifier.
- **Password comparison is constant-time.** The comparison uses an HMAC equality trick to prevent timing attacks — the time it takes to check your password doesn't reveal how many characters are correct.
- **Tokens are signed JWTs.** Each token contains your identity, the app that requested it, and the granted permissions, all signed with your secret key. The Micropub endpoint verifies tokens locally — no network call needed.
- **Authorization codes are single-use** and expire after 10 minutes. They're stored in KV and deleted the moment they're exchanged for a token.
- **Token revocation** works by recording the revoked token's ID in KV. The entry expires automatically when the token would have expired anyway, so KV doesn't fill up over time.

### Token Lifetime

Access tokens expire after 30 days. When a token expires, the Micropub app will need to redirect you through the login flow again to get a new one. There are no refresh tokens — the flow is simple: log in, get a token, use it until it expires, log in again.

### Graceful Fallback

If `JWT_SECRET` is not set, the Micropub endpoint falls back to verifying tokens against the external `TOKEN_ENDPOINT` configured in `wrangler.toml`. This means you can deploy the code changes before setting up the secrets — Micropub will keep working with your existing indieauth.com tokens until you're ready to switch.

## Checklist

After completing the steps above, verify that everything is working:

- [ ] `wrangler.toml` has the `[[kv_namespaces]]` block with your KV namespace ID
- [ ] `JWT_SECRET` secret is set in the Cloudflare dashboard
- [ ] `AUTH_PASSWORD` secret is set in the Cloudflare dashboard
- [ ] A new deployment has been triggered after adding the secrets
- [ ] `/indieauth-metadata` returns valid JSON
- [ ] Page source shows `rel="authorization_endpoint"` pointing to `/auth`
- [ ] Page source shows `rel="token_endpoint"` pointing to `/token`
- [ ] You can sign in with Sparkles or Quill using your site URL
- [ ] The consent page appears with your site's color scheme
- [ ] Publishing a test note via Micropub succeeds after signing in
