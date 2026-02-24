import { renderAdminPage } from "./_lib/admin/admin-page.js";
import type { Env } from "./_lib/github/types.js";

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const html = renderAdminPage({ siteUrl: context.env.SITE_URL });
  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
};
