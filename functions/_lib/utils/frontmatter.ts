import yaml from "yaml";

export function serialize(data: Record<string, unknown>, body: string): string {
  const frontmatter = yaml.stringify(data, { lineWidth: 0 }).trim();
  const content = body.trim();
  return `---\n${frontmatter}\n---\n${content}\n`;
}

export function parse(content: string): { data: Record<string, unknown>; body: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) {
    throw new Error("Invalid frontmatter format");
  }
  const data = yaml.parse(match[1]) || {};
  const body = match[2].trim();
  return { data, body };
}
