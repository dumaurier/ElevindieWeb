import type { Env } from "../github/types.js";

interface BlueskySession {
  did: string;
  accessJwt: string;
  handle: string;
}

interface CreateRecordResponse {
  uri: string;
  cid: string;
}

interface Facet {
  index: { byteStart: number; byteEnd: number };
  features: Array<{ $type: string; uri: string }>;
}

/**
 * Post to Bluesky via AT Protocol.
 * Returns the bsky.app post URL on success, null on failure.
 */
export async function syndicateToBluesky(
  text: string,
  url: string,
  env: Env
): Promise<string | null> {
  try {
    if (!env.BLUESKY_HANDLE || !env.BLUESKY_APP_PASSWORD) {
      return null;
    }

    const pdsUrl = env.BLUESKY_PDS_URL || "https://bsky.social";
    const handle = env.BLUESKY_HANDLE.replace(/^@/, "");
    const session = await createSession(pdsUrl, handle, env.BLUESKY_APP_PASSWORD);
    const facets = buildLinkFacets(text, url);

    const response = await fetch(`${pdsUrl}/xrpc/com.atproto.repo.createRecord`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.accessJwt}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        repo: session.did,
        collection: "app.bsky.feed.post",
        record: {
          $type: "app.bsky.feed.post",
          text,
          createdAt: new Date().toISOString(),
          ...(facets.length > 0 && { facets }),
        },
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error(`Bluesky createRecord failed: ${response.status} ${body}`);
      return null;
    }

    const result: CreateRecordResponse = await response.json();
    return atUriToAppUrl(result.uri, session.handle);
  } catch (error) {
    console.error("Bluesky syndication error:", error);
    return null;
  }
}

async function createSession(
  pdsUrl: string,
  identifier: string,
  password: string
): Promise<BlueskySession> {
  const response = await fetch(`${pdsUrl}/xrpc/com.atproto.server.createSession`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier, password }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Bluesky login failed: ${response.status} ${body}`);
  }

  return response.json();
}

/**
 * Build facets for any URLs found in the text.
 * Uses TextEncoder for correct UTF-8 byte offsets.
 */
function buildLinkFacets(text: string, url: string): Facet[] {
  const start = text.indexOf(url);
  if (start === -1) return [];

  const encoder = new TextEncoder();
  const byteStart = encoder.encode(text.slice(0, start)).length;
  const byteEnd = byteStart + encoder.encode(url).length;

  return [
    {
      index: { byteStart, byteEnd },
      features: [{ $type: "app.bsky.richtext.facet#link", uri: url }],
    },
  ];
}

/**
 * Convert an AT Protocol URI to a bsky.app URL.
 * at://did:plc:xxx/app.bsky.feed.post/rkey → https://bsky.app/profile/handle/post/rkey
 */
function atUriToAppUrl(atUri: string, handle: string): string {
  const rkey = atUri.split("/").pop();
  return `https://bsky.app/profile/${handle}/post/${rkey}`;
}
