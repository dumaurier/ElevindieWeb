import type { Env } from "./_lib/github/types.js";

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const siteUrl = context.env.SITE_URL.replace(/\/$/, "");

  return new Response(
    JSON.stringify({
      issuer: context.env.ME,
      authorization_endpoint: `${siteUrl}/auth`,
      token_endpoint: `${siteUrl}/token`,
      introspection_endpoint: `${siteUrl}/token`,
      revocation_endpoint: `${siteUrl}/token`,
      revocation_endpoint_auth_methods_supported: ["none"],
      code_challenge_methods_supported: ["S256"],
      grant_types_supported: ["authorization_code"],
      response_types_supported: ["code"],
      scopes_supported: ["create", "update", "delete", "media"],
      service_documentation: "https://indieauth.spec.indieweb.org/",
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600",
      },
    }
  );
};
