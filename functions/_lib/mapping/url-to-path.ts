import { invalidRequest } from "../utils/errors.js";

export type ContentType = "post" | "note" | "bookmark";

export interface ResolvedPath {
  contentType: ContentType;
  filePath: string;
  slug: string;
}

export function resolveUrl(url: string, siteUrl: string): ResolvedPath {
  const parsed = new URL(url);
  const siteOrigin = new URL(siteUrl).origin;

  if (parsed.origin !== siteOrigin) {
    throw invalidRequest(`URL origin does not match site: ${parsed.origin} vs ${siteOrigin}`);
  }

  const path = parsed.pathname.replace(/^\//, "").replace(/\/$/, "");

  if (path.startsWith("posts/")) {
    const slug = path.replace("posts/", "");
    return { contentType: "post", filePath: `src/posts/${slug}.md`, slug };
  }

  if (path.startsWith("notes/")) {
    const slug = path.replace("notes/", "");
    return { contentType: "note", filePath: `src/notes/${slug}.md`, slug };
  }

  if (path.startsWith("bookmarks/")) {
    const slug = path.replace("bookmarks/", "");
    return { contentType: "bookmark", filePath: `src/bookmarks/${slug}.md`, slug };
  }

  throw invalidRequest(`Cannot resolve URL to content type: ${url}`);
}
