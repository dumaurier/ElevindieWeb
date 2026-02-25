export interface PostFrontmatter {
  title: string;
  date: string;
  tags: string[];
}

export interface NoteFrontmatter {
  date: string;
  tags: string[];
}

export interface BookmarkFrontmatter {
  title: string;
  bookmarkOf: string;
  date: string;
  tags: string[];
}

export interface ReplyFrontmatter {
  inReplyTo: string;
  title?: string;
  date: string;
  tags: string[];
}

export function toPostFrontmatter(
  properties: Record<string, string[]>
): { data: PostFrontmatter; body: string } {
  const now = new Date().toISOString();

  const tags = ["posts"];
  if (properties.category?.length) {
    tags.push(...properties.category.map((t) => t.toLowerCase()));
  }

  const data: PostFrontmatter = {
    title: properties.name[0],
    date: properties.published?.[0] || now,
    tags,
  };

  const body = properties.content?.[0] || "";
  return { data, body };
}

export function toNoteFrontmatter(
  properties: Record<string, string[]>
): { data: NoteFrontmatter; body: string } {
  const now = new Date().toISOString();

  const tags = ["notes"];
  if (properties.category?.length) {
    tags.push(...properties.category.map((t) => t.toLowerCase()));
  }

  const data: NoteFrontmatter = {
    date: properties.published?.[0] || now,
    tags,
  };

  const body = properties.content?.[0] || "";
  return { data, body };
}

export function toBookmarkFrontmatter(
  properties: Record<string, string[]>
): { data: BookmarkFrontmatter; body: string } {
  const now = new Date().toISOString();

  const tags = ["bookmarks"];
  if (properties.category?.length) {
    tags.push(...properties.category.map((t) => t.toLowerCase()));
  }

  const data: BookmarkFrontmatter = {
    title: properties.name?.[0] || properties["bookmark-of"][0],
    bookmarkOf: properties["bookmark-of"][0],
    date: properties.published?.[0] || now,
    tags,
  };

  const body = properties.content?.[0] || "";
  return { data, body };
}

export function toReplyFrontmatter(
  properties: Record<string, string[]>
): { data: ReplyFrontmatter; body: string } {
  const now = new Date().toISOString();

  const tags = ["replies"];
  if (properties.category?.length) {
    tags.push(...properties.category.map((t) => t.toLowerCase()));
  }

  const data: ReplyFrontmatter = {
    inReplyTo: properties["in-reply-to"][0],
    date: properties.published?.[0] || now,
    tags,
  };

  if (properties.name?.[0]) {
    data.title = properties.name[0];
  }

  const body = properties.content?.[0] || "";
  return { data, body };
}
