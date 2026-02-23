import { verifyToken, requireScope } from "./auth.js";
import { MicropubError, invalidRequest } from "./utils/errors.js";
import { parseBody } from "./utils/parse-body.js";
import { createPost, updatePost, deletePost } from "./handlers/posts.js";
import { createNote, updateNote, deleteNote } from "./handlers/notes.js";
import { createBookmark, updateBookmark, deleteBookmark } from "./handlers/bookmarks.js";
import { handleQuery } from "./handlers/query.js";
import { resolveUrl } from "./mapping/url-to-path.js";
import { syndicate } from "./syndication/syndicate.js";
import type { SyndicationContent } from "./syndication/syndicate.js";
import type { Env } from "./github/types.js";

export async function handleMicropub(
  request: Request,
  env: Env,
  waitUntil?: (promise: Promise<unknown>) => void
): Promise<Response> {
  try {
    const tokenInfo = await verifyToken(request, env);

    if (request.method === "GET") {
      return handleQuery(request, env);
    }

    if (request.method === "POST") {
      const micropubReq = await parseBody(request);

      // Delete
      if (micropubReq.action === "delete") {
        requireScope(tokenInfo, "delete");
        if (!micropubReq.url) throw invalidRequest("Missing url for delete");
        const resolved = resolveUrl(micropubReq.url, env.SITE_URL);

        switch (resolved.contentType) {
          case "post": return deletePost(resolved.filePath, env);
          case "note": return deleteNote(resolved.filePath, env);
          case "bookmark": return deleteBookmark(resolved.filePath, env);
        }
      }

      // Update
      if (micropubReq.action === "update") {
        requireScope(tokenInfo, "update");
        if (!micropubReq.url) throw invalidRequest("Missing url for update");
        const resolved = resolveUrl(micropubReq.url, env.SITE_URL);

        switch (resolved.contentType) {
          case "post": return updatePost(resolved.filePath, resolved.slug, micropubReq, env);
          case "note": return updateNote(resolved.filePath, resolved.slug, micropubReq, env);
          case "bookmark": return updateBookmark(resolved.filePath, resolved.slug, micropubReq, env);
        }
      }

      // Create — route by post type discovery
      requireScope(tokenInfo, "create");

      let response: Response;
      let syndicationContent: SyndicationContent | null = null;

      if (micropubReq.properties["bookmark-of"]?.[0]) {
        response = await createBookmark(micropubReq, env);
        if (response.status === 201) {
          syndicationContent = {
            body: micropubReq.properties.content?.[0] || "",
            url: response.headers.get("Location")!,
            contentType: "bookmark",
            title: micropubReq.properties.name?.[0] || micropubReq.properties["bookmark-of"][0],
            bookmarkUrl: micropubReq.properties["bookmark-of"][0],
          };
        }
      } else if (micropubReq.properties.name?.[0]) {
        response = await createPost(micropubReq, env);
        if (response.status === 201) {
          syndicationContent = {
            body: micropubReq.properties.content?.[0] || "",
            url: response.headers.get("Location")!,
            contentType: "post",
            title: micropubReq.properties.name[0],
          };
        }
      } else {
        response = await createNote(micropubReq, env);
        if (response.status === 201) {
          syndicationContent = {
            body: micropubReq.properties.content?.[0] || "",
            url: response.headers.get("Location")!,
            contentType: "note",
          };
        }
      }

      // Syndicate in background if targets were requested
      if (syndicationContent && micropubReq.syndicateTo.length > 0 && waitUntil) {
        const resolved = resolveUrl(syndicationContent.url, env.SITE_URL);
        waitUntil(
          syndicate(syndicationContent, micropubReq.syndicateTo, resolved.filePath, env)
        );
      }

      return response;
    }

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: { Allow: "GET, POST, OPTIONS" },
      });
    }

    return new Response("Method not allowed", { status: 405 });

  } catch (error) {
    if (error instanceof MicropubError) {
      return error.toResponse();
    }
    return new Response(
      JSON.stringify({ error: "server_error", error_description: String(error) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
