import { GitHubClient } from "../github/client.js";
import type { Env } from "../github/types.js";
import { toSlug } from "../utils/slug.js";
import { toBookmarkFrontmatter } from "../mapping/micropub-to-fm.js";
import { serialize, parse } from "../utils/frontmatter.js";
import { created, noContent } from "../utils/response.js";
import { invalidRequest } from "../utils/errors.js";
import type { MicropubRequest } from "../utils/parse-body.js";

export async function createBookmark(
  micropubReq: MicropubRequest,
  env: Env
): Promise<Response> {
  if (!micropubReq.properties["bookmark-of"]?.[0]) {
    throw invalidRequest("Bookmarks require a bookmark-of property");
  }

  const { data, body } = toBookmarkFrontmatter(micropubReq.properties);
  const slug = toSlug(data.title);
  const filePath = `src/bookmarks/${slug}.md`;

  const github = new GitHubClient(env);

  const existing = await github.getFile(filePath);
  if (existing) {
    let suffix = 2;
    let altPath = `src/bookmarks/${slug}-${suffix}.md`;
    while (await github.getFile(altPath)) {
      suffix++;
      altPath = `src/bookmarks/${slug}-${suffix}.md`;
    }
    const content = serialize(data as Record<string, unknown>, body);
    await github.createFile(altPath, content, `micropub: create bookmark "${data.title}"`);
    return created(`${env.SITE_URL}/bookmarks/${slug}-${suffix}/`);
  }

  const content = serialize(data as Record<string, unknown>, body);
  await github.createFile(filePath, content, `micropub: create bookmark "${data.title}"`);
  return created(`${env.SITE_URL}/bookmarks/${slug}/`);
}

export async function updateBookmark(
  filePath: string,
  slug: string,
  micropubReq: MicropubRequest,
  env: Env
): Promise<Response> {
  const github = new GitHubClient(env);
  const file = await github.getFile(filePath);
  if (!file) {
    throw invalidRequest("Bookmark not found");
  }

  const { data, body } = parse(file.content);

  if (micropubReq.replace) {
    for (const [prop, values] of Object.entries(micropubReq.replace)) {
      if (prop === "content") continue;
      const field = bookmarkMicropubToField(prop);
      if (field === "tags") {
        data[field] = values;
      } else if (field === "date") {
        data[field] = values[0]?.split("T")[0];
      } else {
        data[field] = values[0];
      }
    }
  }

  if (micropubReq.add) {
    for (const [prop, values] of Object.entries(micropubReq.add)) {
      const field = bookmarkMicropubToField(prop);
      const existing = data[field];
      if (Array.isArray(existing)) {
        data[field] = [...(existing as unknown[]), ...values];
      } else {
        data[field] = values;
      }
    }
  }

  if (micropubReq.delete) {
    if (Array.isArray(micropubReq.delete)) {
      for (const prop of micropubReq.delete) {
        delete data[bookmarkMicropubToField(prop)];
      }
    } else {
      for (const [prop, values] of Object.entries(micropubReq.delete)) {
        const field = bookmarkMicropubToField(prop);
        const existing = data[field];
        if (Array.isArray(existing)) {
          data[field] = (existing as unknown[]).filter(
            (v: unknown) => !values.includes(String(v))
          );
        }
      }
    }
  }

  const newTitle = data.title as string;
  const newSlug = toSlug(newTitle);
  const updatedBody = micropubReq.replace?.content?.[0] ?? body;
  const newContent = serialize(data, updatedBody);

  if (newSlug !== slug) {
    const newPath = `src/bookmarks/${newSlug}.md`;
    await github.deleteFile(filePath, file.sha, `micropub: rename bookmark "${slug}" to "${newSlug}"`);
    await github.createFile(newPath, newContent, `micropub: update bookmark "${newTitle}"`);
    return created(`${env.SITE_URL}/bookmarks/${newSlug}/`);
  }

  await github.updateFile(filePath, newContent, file.sha, `micropub: update bookmark "${newTitle}"`);
  return noContent();
}

export async function deleteBookmark(
  filePath: string,
  env: Env
): Promise<Response> {
  const github = new GitHubClient(env);
  const file = await github.getFile(filePath);
  if (!file) {
    throw invalidRequest("Bookmark not found");
  }

  await github.deleteFile(filePath, file.sha, `micropub: delete "${filePath}"`);
  return noContent();
}

function bookmarkMicropubToField(prop: string): string {
  const map: Record<string, string> = {
    name: "title",
    "bookmark-of": "bookmarkOf",
    published: "date",
    category: "tags",
  };
  return map[prop] || prop;
}
