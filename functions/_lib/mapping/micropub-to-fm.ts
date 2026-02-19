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

export function toPostFrontmatter(
  properties: Record<string, string[]>
): { data: PostFrontmatter; body: string } {
  const today = new Date().toISOString().split("T")[0];

  const tags = ["posts"];
  if (properties.category?.length) {
    tags.push(...properties.category);
  }

  const data: PostFrontmatter = {
    title: properties.name[0],
    date: properties.published?.[0]?.split("T")[0] || today,
    tags,
  };

  const body = properties.content?.[0] || "";
  return { data, body };
}

export function toNoteFrontmatter(
  properties: Record<string, string[]>
): { data: NoteFrontmatter; body: string } {
  const today = new Date().toISOString().split("T")[0];

  const tags = ["notes"];
  if (properties.category?.length) {
    tags.push(...properties.category);
  }

  const data: NoteFrontmatter = {
    date: properties.published?.[0]?.split("T")[0] || today,
    tags,
  };

  const body = properties.content?.[0] || "";
  return { data, body };
}

export function toBookmarkFrontmatter(
  properties: Record<string, string[]>
): { data: BookmarkFrontmatter; body: string } {
  const today = new Date().toISOString().split("T")[0];

  const tags = ["bookmarks"];
  if (properties.category?.length) {
    tags.push(...properties.category);
  }

  const data: BookmarkFrontmatter = {
    title: properties.name?.[0] || properties["bookmark-of"][0],
    bookmarkOf: properties["bookmark-of"][0],
    date: properties.published?.[0]?.split("T")[0] || today,
    tags,
  };

  const body = properties.content?.[0] || "";
  return { data, body };
}
