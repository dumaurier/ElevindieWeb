import type { Env } from "../github/types.js";

interface MastodonStatus {
  id: string;
  url: string;
}

/**
 * Post to Mastodon via API.
 * Returns the status URL on success, null on failure.
 */
export async function syndicateToMastodon(
  text: string,
  env: Env
): Promise<string | null> {
  try {
    if (!env.MASTODON_INSTANCE_URL || !env.MASTODON_ACCESS_TOKEN) {
      return null;
    }

    const instanceUrl = env.MASTODON_INSTANCE_URL.replace(/\/$/, "");

    const response = await fetch(`${instanceUrl}/api/v1/statuses`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.MASTODON_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status: text,
        visibility: "public",
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error(`Mastodon post failed: ${response.status} ${body}`);
      return null;
    }

    const result: MastodonStatus = await response.json();
    return result.url;
  } catch (error) {
    console.error("Mastodon syndication error:", error);
    return null;
  }
}
