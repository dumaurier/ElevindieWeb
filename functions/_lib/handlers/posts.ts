import { GitHubClient } from "../github/client.js";
import type { Env } from "../github/types.js";
import { toSlug } from "../utils/slug.js";
import { toPostFrontmatter } from "../mapping/micropub-to-fm.js";
import { serialize, parse } from "../utils/frontmatter.js";
import { created, noContent } from "../utils/response.js";
import { invalidRequest } from "../utils/errors.js";
import type { MicropubRequest } from "../utils/parse-body.js";

export async function createPost(
  micropubReq: MicropubRequest,
  env: Env
): Promise<Response> {
  if (!micropubReq.properties.name?.[0]) {
    throw invalidRequest("Articles require a name property");
  }

  const { data, body } = toPostFrontmatter(micropubReq.properties);
  const slug = toSlug(data.title);
  const filePath = `src/posts/${slug}.md`;

  const github = new GitHubClient(env);

  const existing = await github.getFile(filePath);
  if (existing) {
    let suffix = 2;
    let altPath = `src/posts/${slug}-${suffix}.md`;
    while (await github.getFile(altPath)) {
      suffix++;
      altPath = `src/posts/${slug}-${suffix}.md`;
    }
    const content = serialize(data as Record<string, unknown>, body);
    await github.createFile(altPath, content, `micropub: create post "${data.title}"`);
    return created(`${env.SITE_URL}/posts/${slug}-${suffix}/`);
  }

  const content = serialize(data as Record<string, unknown>, body);
  await github.createFile(filePath, content, `micropub: create post "${data.title}"`);
  return created(`${env.SITE_URL}/posts/${slug}/`);
}

export async function updatePost(
  filePath: string,
  slug: string,
  micropubReq: MicropubRequest,
  env: Env
): Promise<Response> {
  const github = new GitHubClient(env);
  const file = await github.getFile(filePath);
  if (!file) {
    throw invalidRequest("Post not found");
  }

  const { data, body } = parse(file.content);

  if (micropubReq.replace) {
    for (const [prop, values] of Object.entries(micropubReq.replace)) {
      if (prop === "content") continue;
      const field = postMicropubToField(prop);
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
      const field = postMicropubToField(prop);
      const existing = data[field];
      if (Array.isArray(existing)) {
        data[field] = [...existing, ...values];
      } else {
        data[field] = values;
      }
    }
  }

  if (micropubReq.delete) {
    if (Array.isArray(micropubReq.delete)) {
      for (const prop of micropubReq.delete) {
        delete data[postMicropubToField(prop)];
      }
    } else {
      for (const [prop, values] of Object.entries(micropubReq.delete)) {
        const field = postMicropubToField(prop);
        const existing = data[field];
        if (Array.isArray(existing)) {
          data[field] = existing.filter((v: unknown) => !values.includes(String(v)));
        }
      }
    }
  }

  const newTitle = data.title as string;
  const newSlug = toSlug(newTitle);
  const updatedBody = micropubReq.replace?.content?.[0] ?? body;
  const newContent = serialize(data, updatedBody);

  if (newSlug !== slug) {
    const newPath = `src/posts/${newSlug}.md`;
    await github.deleteFile(filePath, file.sha, `micropub: rename post "${slug}" to "${newSlug}"`);
    await github.createFile(newPath, newContent, `micropub: update post "${newTitle}"`);
    return created(`${env.SITE_URL}/posts/${newSlug}/`);
  }

  await github.updateFile(filePath, newContent, file.sha, `micropub: update post "${newTitle}"`);
  return noContent();
}

export async function deletePost(
  filePath: string,
  env: Env
): Promise<Response> {
  const github = new GitHubClient(env);
  const file = await github.getFile(filePath);
  if (!file) {
    throw invalidRequest("Post not found");
  }

  await github.deleteFile(filePath, file.sha, `micropub: delete "${filePath}"`);
  return noContent();
}

function postMicropubToField(prop: string): string {
  const map: Record<string, string> = {
    name: "title",
    published: "date",
    category: "tags",
  };
  return map[prop] || prop;
}
