import slugify from "slugify";

export function toSlug(str: string): string {
  return slugify(str, {
    replacement: "-",
    remove: /[#,&,+()$~%.'":*?!<>{}]/g,
    lower: true,
  });
}

export function toTimestampSlug(date?: Date): string {
  const d = date || new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}
