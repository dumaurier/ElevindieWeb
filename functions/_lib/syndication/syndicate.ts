import type { Env } from "../github/types.js";
import { GitHubClient } from "../github/client.js";
import { parse, serialize } from "../utils/frontmatter.js";
import { syndicateToBluesky } from "./bluesky.js";
import { syndicateToMastodon } from "./mastodon.js";
// @ts-expect-error - meta.js is a JS configuration file outside functions directory
import meta from "../../../src/_data/meta.js";

export interface SyndicationContent {
  body: string;
  url: string;
  contentType: "post" | "note" | "bookmark" | "reply";
  title?: string;
  bookmarkUrl?: string;
  replyToUrl?: string;
  tags?: string[];
}

export interface SyndicateTarget {
  uid: string;
  name: string;
}

const BLUESKY_UID = "https://bsky.social";
const POLL_INTERVAL_MS = 5_000;
const POLL_MAX_MS = 15_000;

/**
 * Returns available syndication targets based on configured env vars.
 */
export function getAvailableTargets(env: Env): SyndicateTarget[] {
  const targets: SyndicateTarget[] = [];

  if (env.BLUESKY_HANDLE && env.BLUESKY_APP_PASSWORD) {
    targets.push({ uid: BLUESKY_UID, name: "Bluesky" });
  }

  if (env.MASTODON_INSTANCE_URL && env.MASTODON_ACCESS_TOKEN) {
    targets.push({
      uid: env.MASTODON_INSTANCE_URL.replace(/\/$/, ""),
      name: "Mastodon",
    });
  }

  return targets;
}

/**
 * Format post text for syndication based on content type.
 */
function formatText(content: SyndicationContent): string {
  // Retrieve whitelist from meta.js (fallback to empty array if undefined)
  const socialWhitelist: string[] = meta.socialWhitelist || [];

  const hashtags = (content.tags || [])
    .filter((tag) => socialWhitelist.includes(tag.toLowerCase()))
    .map((tag) => {
      const words = tag.split(/[-_\s]+/);
      return "#" + words.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join("");
    })
    .join(" ");

  const tagsSuffix = hashtags ? `\n\n${hashtags}` : "";

  switch (content.contentType) {
    case "post":
      return `"${content.title}"\n\n${content.url}${tagsSuffix}`;
    case "note":
      return `${content.body}${tagsSuffix}\n\n${content.url}`;
    case "bookmark":
      return `Bookmarked: ${content.title}\n${content.bookmarkUrl}${tagsSuffix}\n\n${content.url}`;
    case "reply":
      return `Re: ${content.replyToUrl}\n\n${content.body}${tagsSuffix}\n\n${content.url}`;
  }
}

/**
 * Poll a URL until it returns 200, so syndicated links aren't dead.
 * Gives the CF Pages build time to finish before posting to platforms.
 */
async function waitForUrl(url: string): Promise<boolean> {
  const deadline = Date.now() + POLL_MAX_MS;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url, { method: "HEAD", redirect: "follow" });
      if (res.ok) return true;
    } catch {
      // Network error — keep trying
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
  return false;
}

/**
 * Syndicate content to requested targets and update frontmatter with URLs.
 * Designed to run inside waitUntil — never throws.
 */
export async function syndicate(
  content: SyndicationContent,
  targets: string[],
  filePath: string,
  env: Env
): Promise<void> {
  try {
    const available = getAvailableTargets(env);
    const text = formatText(content);

    const urlIsLive = await waitForUrl(content.url);
    if (!urlIsLive) {
      console.warn(`Syndication: URL ${content.url} not live yet after 15s, proceeding anyway.`);
    }

    const promises: Array<Promise<{ uid: string; url: string | null }>> = [];

    for (const targetUid of targets) {
      const target = available.find((t) => t.uid === targetUid);
      if (!target) continue;

      if (targetUid === BLUESKY_UID) {
        promises.push(
          syndicateToBluesky(text, content.url, env).then((url) => ({
            uid: targetUid,
            url,
          }))
        );
      } else if (env.MASTODON_INSTANCE_URL && targetUid === env.MASTODON_INSTANCE_URL.replace(/\/$/, "")) {
        promises.push(
          syndicateToMastodon(text, env).then((url) => ({
            uid: targetUid,
            url,
          }))
        );
      }
    }

    if (promises.length === 0) return;

    const results = await Promise.allSettled(promises);
    const syndicatedUrls: string[] = [];

    for (const result of results) {
      if (result.status === "fulfilled" && result.value.url) {
        syndicatedUrls.push(result.value.url);
      } else if (result.status === "rejected") {
        console.error("Syndication target failed:", result.reason);
      }
    }

    if (syndicatedUrls.length > 0) {
      await updateFrontmatterWithSyndication(filePath, syndicatedUrls, env);
    }
  } catch (error) {
    console.error("Syndication orchestration error:", error);
  }
}

/**
 * Read the committed file, add syndicatedTo to frontmatter, write it back.
 */
async function updateFrontmatterWithSyndication(
  filePath: string,
  syndicatedUrls: string[],
  env: Env
): Promise<void> {
  const github = new GitHubClient(env);
  const file = await github.getFile(filePath);

  if (!file) {
    console.error(`Cannot update frontmatter: file not found at ${filePath}`);
    return;
  }

  const { data, body } = parse(file.content);
  data.syndicatedTo = syndicatedUrls;
  const newContent = serialize(data, body);

  await github.updateFile(
    filePath,
    newContent,
    file.sha,
    `syndication: add syndicated URLs to ${filePath}`
  );
}
