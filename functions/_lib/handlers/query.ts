import { GitHubClient } from "../github/client.js";
import type { Env } from "../github/types.js";
import { parse } from "../utils/frontmatter.js";
import { postToMicropub, noteToMicropub, bookmarkToMicropub } from "../mapping/fm-to-micropub.js";
import { json } from "../utils/response.js";
import { invalidRequest } from "../utils/errors.js";

export async function handleQuery(
  request: Request,
  env: Env
): Promise<Response> {
  const url = new URL(request.url);
  const q = url.searchParams.get("q");

  if (!q) {
    throw invalidRequest("Missing q parameter");
  }

  switch (q) {
    case "config":
      return json({
        "media-endpoint": null,
        "syndicate-to": [],
        q: ["config", "source", "syndicate-to"],
      });

    case "syndicate-to":
      return json({ "syndicate-to": [] });

    case "source":
      return handleSourceQuery(url, env);

    default:
      throw invalidRequest(`Unsupported query: ${q}`);
  }
}

async function handleSourceQuery(url: URL, env: Env): Promise<Response> {
  const sourceUrl = url.searchParams.get("url");
  if (!sourceUrl) {
    throw invalidRequest("Missing url parameter for q=source");
  }

  const parsed = new URL(sourceUrl);
  const path = parsed.pathname.replace(/^\//, "").replace(/\/$/, "");

  const github = new GitHubClient(env);

  if (path.startsWith("posts/")) {
    const slug = path.replace("posts/", "");
    const filePath = `src/posts/${slug}.md`;
    const file = await github.getFile(filePath);
    if (!file) {
      throw invalidRequest("Post not found");
    }
    const { data, body } = parse(file.content);
    return json(postToMicropub(data, body));
  }

  if (path.startsWith("notes/")) {
    const slug = path.replace("notes/", "");
    const filePath = `src/notes/${slug}.md`;
    const file = await github.getFile(filePath);
    if (!file) {
      throw invalidRequest("Note not found");
    }
    const { data, body } = parse(file.content);
    return json(noteToMicropub(data, body));
  }

  if (path.startsWith("bookmarks/")) {
    const slug = path.replace("bookmarks/", "");
    const filePath = `src/bookmarks/${slug}.md`;
    const file = await github.getFile(filePath);
    if (!file) {
      throw invalidRequest("Bookmark not found");
    }
    const { data, body } = parse(file.content);
    return json(bookmarkToMicropub(data, body));
  }

  throw invalidRequest("Unsupported content URL");
}
