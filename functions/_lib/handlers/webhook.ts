import type { Env } from "../github/types.js";
import { GitHubClient } from "../github/client.js";
import { parse } from "../utils/frontmatter.js";
import { syndicate, getAvailableTargets } from "../syndication/syndicate.js";
import type { SyndicationContent } from "../syndication/syndicate.js";

interface PushEvent {
  ref: string;
  commits: Array<{
    id: string;
    message: string;
    added: string[];
    removed: string[];
    modified: string[];
  }>;
}

type ContentType = "post" | "note" | "bookmark";

const CONTENT_DIRS: Record<string, ContentType> = {
  "src/posts/": "post",
  "src/notes/": "note",
  "src/bookmarks/": "bookmark",
};

/**
 * Handle a GitHub push webhook.
 * Finds newly added content files with `syndicate: true` in frontmatter
 * and syndicates them to configured platforms.
 */
export async function handleWebhook(
  request: Request,
  env: Env,
  waitUntil?: (promise: Promise<unknown>) => void
): Promise<Response> {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  if (!env.GITHUB_WEBHOOK_SECRET) {
    return new Response("Webhook not configured", { status: 503 });
  }

  const body = await request.text();

  const isValid = await verifySignature(
    body,
    request.headers.get("X-Hub-Signature-256") || "",
    env.GITHUB_WEBHOOK_SECRET
  );

  if (!isValid) {
    return new Response("Invalid signature", { status: 401 });
  }

  // Only process push events
  const event = request.headers.get("X-GitHub-Event");
  if (event === "ping") {
    return new Response("pong", { status: 200 });
  }
  if (event !== "push") {
    return new Response("Ignored event", { status: 200 });
  }

  let payload: PushEvent;
  try {
    payload = JSON.parse(body);
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  // Only process pushes to the configured branch
  const expectedRef = `refs/heads/${env.GITHUB_BRANCH}`;
  if (payload.ref !== expectedRef) {
    return new Response("Ignored branch", { status: 200 });
  }

  // No syndication targets configured — nothing to do
  if (getAvailableTargets(env).length === 0) {
    return new Response("No syndication targets configured", { status: 200 });
  }

  // Collect all newly added content files across all commits
  const addedFiles = new Set<string>();
  for (const commit of payload.commits) {
    for (const file of commit.added) {
      if (isContentFile(file)) {
        addedFiles.add(file);
      }
    }
  }

  if (addedFiles.size === 0) {
    return new Response("No new content files", { status: 200 });
  }

  // Process in background so GitHub gets a fast response
  if (waitUntil) {
    waitUntil(processNewFiles(addedFiles, env));
  }

  return new Response("OK", { status: 200 });
}

function isContentFile(path: string): boolean {
  if (!path.endsWith(".md")) return false;
  return Object.keys(CONTENT_DIRS).some((dir) => path.startsWith(dir));
}

function getContentType(path: string): ContentType {
  for (const [dir, type] of Object.entries(CONTENT_DIRS)) {
    if (path.startsWith(dir)) return type;
  }
  throw new Error(`Unknown content directory for path: ${path}`);
}

function filePathToUrl(filePath: string, siteUrl: string): string {
  // src/posts/my-post.md → /posts/my-post/
  const slug = filePath
    .replace(/^src\//, "")
    .replace(/\.md$/, "");
  return `${siteUrl.replace(/\/$/, "")}/${slug}/`;
}

async function processNewFiles(files: Set<string>, env: Env): Promise<void> {
  const github = new GitHubClient(env);
  const allTargetUids = getAvailableTargets(env).map((t) => t.uid);

  for (const filePath of files) {
    try {
      const file = await github.getFile(filePath);
      if (!file) {
        console.error(`Webhook: file not found: ${filePath}`);
        continue;
      }

      const { data, body } = parse(file.content);

      // Only syndicate if explicitly opted in
      if (!data.syndicate) continue;

      // Skip if already syndicated (e.g. by Micropub path)
      if (data.syndicatedTo && Array.isArray(data.syndicatedTo) && data.syndicatedTo.length > 0) {
        continue;
      }

      const contentType = getContentType(filePath);
      const url = filePathToUrl(filePath, env.SITE_URL);

      const content: SyndicationContent = {
        body,
        url,
        contentType,
        title: data.title as string | undefined,
        bookmarkUrl: data.bookmarkOf as string | undefined,
      };

      await syndicate(content, allTargetUids, filePath, env);
    } catch (error) {
      console.error(`Webhook: error processing ${filePath}:`, error);
    }
  }
}

/**
 * Verify GitHub webhook HMAC-SHA256 signature.
 */
async function verifySignature(
  body: string,
  signatureHeader: string,
  secret: string
): Promise<boolean> {
  if (!signatureHeader.startsWith("sha256=")) {
    return false;
  }

  const expectedHex = signatureHeader.slice("sha256=".length);

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(body)
  );

  const computedHex = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Constant-time comparison
  if (expectedHex.length !== computedHex.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expectedHex.length; i++) {
    mismatch |= expectedHex.charCodeAt(i) ^ computedHex.charCodeAt(i);
  }
  return mismatch === 0;
}
