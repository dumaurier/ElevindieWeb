export function postToMicropub(
  data: Record<string, unknown>,
  body: string
): { type: string[]; properties: Record<string, string[]> } {
  const properties: Record<string, string[]> = {};

  if (data.title) properties.name = [String(data.title)];
  if (data.date) properties.published = [String(data.date)];
  if (body) properties.content = [body];

  if (Array.isArray(data.tags)) {
    const userTags = data.tags.filter((t: unknown) => t !== "posts").map(String);
    if (userTags.length) properties.category = userTags;
  }

  return { type: ["h-entry"], properties };
}

export function noteToMicropub(
  data: Record<string, unknown>,
  body: string
): { type: string[]; properties: Record<string, string[]> } {
  const properties: Record<string, string[]> = {};

  if (data.date) properties.published = [String(data.date)];
  if (body) properties.content = [body];

  if (Array.isArray(data.tags)) {
    const userTags = data.tags.filter((t: unknown) => t !== "notes").map(String);
    if (userTags.length) properties.category = userTags;
  }

  return { type: ["h-entry"], properties };
}

export function bookmarkToMicropub(
  data: Record<string, unknown>,
  body: string
): { type: string[]; properties: Record<string, string[]> } {
  const properties: Record<string, string[]> = {};

  if (data.title) properties.name = [String(data.title)];
  if (data.bookmarkOf) properties["bookmark-of"] = [String(data.bookmarkOf)];
  if (data.date) properties.published = [String(data.date)];
  if (body) properties.content = [body];

  if (Array.isArray(data.tags)) {
    const userTags = data.tags.filter((t: unknown) => t !== "bookmarks").map(String);
    if (userTags.length) properties.category = userTags;
  }

  return { type: ["h-entry"], properties };
}
