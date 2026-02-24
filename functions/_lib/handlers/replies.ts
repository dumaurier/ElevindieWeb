import { GitHubClient } from "../github/client.js";
import type { Env } from "../github/types.js";
import { toTimestampSlug } from "../utils/slug.js";
import { toReplyFrontmatter } from "../mapping/micropub-to-fm.js";
import { serialize, parse } from "../utils/frontmatter.js";
import { created, noContent } from "../utils/response.js";
import { invalidRequest } from "../utils/errors.js";
import type { MicropubRequest } from "../utils/parse-body.js";

export async function createReply(
  micropubReq: MicropubRequest,
  env: Env
): Promise<Response> {
  if (!micropubReq.properties["in-reply-to"]?.[0]) {
    throw invalidRequest("Replies require an in-reply-to property");
  }

  const { data, body } = toReplyFrontmatter(micropubReq.properties);
  const slug = toTimestampSlug();
  const filePath = `src/replies/${slug}.md`;
  const content = serialize(data as Record<string, unknown>, body);

  const github = new GitHubClient(env);

  const existing = await github.getFile(filePath);
  if (existing) {
    let suffix = 2;
    let altPath = `src/replies/${slug}-${suffix}.md`;
    while (await github.getFile(altPath)) {
      suffix++;
      altPath = `src/replies/${slug}-${suffix}.md`;
    }
    await github.createFile(altPath, content, `micropub: create reply ${slug}-${suffix}`);
    return created(`${env.SITE_URL}/replies/${slug}-${suffix}/`);
  }

  await github.createFile(filePath, content, `micropub: create reply ${slug}`);
  return created(`${env.SITE_URL}/replies/${slug}/`);
}

export async function updateReply(
  filePath: string,
  slug: string,
  micropubReq: MicropubRequest,
  env: Env
): Promise<Response> {
  const github = new GitHubClient(env);
  const file = await github.getFile(filePath);
  if (!file) {
    throw invalidRequest("Reply not found");
  }

  const { data, body } = parse(file.content);

  if (micropubReq.replace) {
    for (const [prop, values] of Object.entries(micropubReq.replace)) {
      if (prop === "content") continue;
      const field = replyMicropubToField(prop);
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
      const field = replyMicropubToField(prop);
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
        delete data[replyMicropubToField(prop)];
      }
    } else {
      for (const [prop, values] of Object.entries(micropubReq.delete)) {
        const field = replyMicropubToField(prop);
        const existing = data[field];
        if (Array.isArray(existing)) {
          data[field] = (existing as unknown[]).filter(
            (v: unknown) => !values.includes(String(v))
          );
        }
      }
    }
  }

  const updatedBody = micropubReq.replace?.content?.[0] ?? body;
  const newContent = serialize(data, updatedBody);
  await github.updateFile(filePath, newContent, file.sha, `micropub: update reply ${slug}`);
  return noContent();
}

export async function deleteReply(
  filePath: string,
  env: Env
): Promise<Response> {
  const github = new GitHubClient(env);
  const file = await github.getFile(filePath);
  if (!file) {
    throw invalidRequest("Reply not found");
  }

  await github.deleteFile(filePath, file.sha, `micropub: delete "${filePath}"`);
  return noContent();
}

function replyMicropubToField(prop: string): string {
  const map: Record<string, string> = {
    name: "title",
    "in-reply-to": "inReplyTo",
    published: "date",
    category: "tags",
  };
  return map[prop] || prop;
}
