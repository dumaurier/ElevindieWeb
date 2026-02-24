import type { Env } from "../github/types.js";
import type { AuthCodeData } from "./types.js";
import { verifyPassword } from "./password.js";
import { verifyPkce } from "./pkce.js";
import { renderConsentPage } from "./consent-page.js";

/**
 * Handle GET /auth — render the consent/login page.
 *
 * Validates required OAuth parameters, then returns HTML.
 */
export async function handleAuthorizationGet(
  request: Request,
  env: Env
): Promise<Response> {
  const url = new URL(request.url);

  const response_type = url.searchParams.get("response_type");
  const client_id = url.searchParams.get("client_id");
  const redirect_uri = url.searchParams.get("redirect_uri");
  const state = url.searchParams.get("state");
  const code_challenge = url.searchParams.get("code_challenge");
  const code_challenge_method = url.searchParams.get("code_challenge_method");
  const scope = url.searchParams.get("scope") || "";
  const me = url.searchParams.get("me") || env.ME;

  if (response_type !== "code") {
    return errorResponse(400, "invalid_request", 'response_type must be "code"');
  }
  if (!client_id || !isValidUrl(client_id)) {
    return errorResponse(400, "invalid_request", "client_id must be a valid URL");
  }
  if (!redirect_uri || !isValidUrl(redirect_uri)) {
    return errorResponse(400, "invalid_request", "redirect_uri must be a valid URL");
  }
  if (!state) {
    return errorResponse(400, "invalid_request", "state is required");
  }
  if (!code_challenge) {
    return errorResponse(400, "invalid_request", "code_challenge is required (PKCE)");
  }
  if (code_challenge_method !== "S256") {
    return errorResponse(400, "invalid_request", 'code_challenge_method must be "S256"');
  }

  const html = renderConsentPage({
    client_id,
    redirect_uri,
    state,
    scope,
    code_challenge,
    code_challenge_method,
    me,
  });

  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

/**
 * Handle POST /auth — process consent form or auth-only code exchange.
 *
 * Detects request type by form body contents:
 * - Has "password" field → consent form submission
 * - Has "grant_type" field → auth-only code exchange from client
 */
export async function handleAuthorizationPost(
  request: Request,
  env: Env
): Promise<Response> {
  if (!env.AUTH_PASSWORD || !env.INDIEAUTH_KV) {
    return errorResponse(503, "server_error", "IndieAuth not configured");
  }

  const formData = await request.formData();

  // Detect: auth-only code exchange (client POST, not browser form)
  if (formData.get("grant_type")) {
    return handleAuthOnlyExchange(formData, env);
  }

  // Consent form submission
  return handleConsentSubmission(formData, env);
}

/**
 * Process the consent form (user clicked Approve or Deny).
 */
async function handleConsentSubmission(
  formData: FormData,
  env: Env
): Promise<Response> {
  const action = formData.get("action") as string;
  const client_id = formData.get("client_id") as string;
  const redirect_uri = formData.get("redirect_uri") as string;
  const state = formData.get("state") as string;
  const code_challenge = formData.get("code_challenge") as string;
  const code_challenge_method = formData.get("code_challenge_method") as string;
  const me = formData.get("me") as string;
  const password = formData.get("password") as string;

  if (!client_id || !redirect_uri || !state || !code_challenge) {
    return errorResponse(400, "invalid_request", "Missing required parameters");
  }

  // User denied
  if (action === "deny") {
    const denyUrl = new URL(redirect_uri);
    denyUrl.searchParams.set("error", "access_denied");
    denyUrl.searchParams.set("state", state);
    return Response.redirect(denyUrl.toString(), 302);
  }

  // Verify password
  const passwordValid = await verifyPassword(password || "", env.AUTH_PASSWORD!);
  if (!passwordValid) {
    const scopes = formData.getAll("scope") as string[];
    const html = renderConsentPage({
      client_id,
      redirect_uri,
      state,
      scope: scopes.join(" "),
      code_challenge,
      code_challenge_method,
      me,
      error: "Incorrect password",
    });
    return new Response(html, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  // Generate authorization code
  const codeBytes = crypto.getRandomValues(new Uint8Array(32));
  const code = Array.from(codeBytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Collect approved scopes from checkboxes
  const approvedScopes = (formData.getAll("scope") as string[]).join(" ");

  // Store auth code data in KV
  const authCodeData: AuthCodeData = {
    client_id,
    redirect_uri,
    code_challenge,
    code_challenge_method: "S256",
    scope: approvedScopes,
    me,
    created_at: Date.now(),
  };

  await env.INDIEAUTH_KV!.put(`code:${code}`, JSON.stringify(authCodeData), {
    expirationTtl: 600,
  });

  // Redirect back to client with code
  const redirectUrl = new URL(redirect_uri);
  redirectUrl.searchParams.set("code", code);
  redirectUrl.searchParams.set("state", state);
  redirectUrl.searchParams.set("iss", env.ME);
  return Response.redirect(redirectUrl.toString(), 302);
}

/**
 * Handle auth-only code exchange (POST to /auth with grant_type=authorization_code).
 *
 * Per IndieAuth spec, when no scopes were requested, the client exchanges
 * the code at the authorization endpoint and gets back { me, profile }.
 */
async function handleAuthOnlyExchange(
  formData: FormData,
  env: Env
): Promise<Response> {
  const grant_type = formData.get("grant_type") as string;
  const code = formData.get("code") as string;
  const client_id = formData.get("client_id") as string;
  const redirect_uri = formData.get("redirect_uri") as string;
  const code_verifier = formData.get("code_verifier") as string;

  if (grant_type !== "authorization_code") {
    return errorResponse(400, "unsupported_grant_type", "Only authorization_code is supported");
  }
  if (!code || !client_id || !redirect_uri || !code_verifier) {
    return errorResponse(400, "invalid_request", "Missing required parameters");
  }

  // Look up and consume the authorization code
  const stored = await env.INDIEAUTH_KV!.get(`code:${code}`);
  if (!stored) {
    return errorResponse(400, "invalid_grant", "Authorization code not found or expired");
  }

  await env.INDIEAUTH_KV!.delete(`code:${code}`);
  const authCodeData: AuthCodeData = JSON.parse(stored);

  // Validate client_id and redirect_uri match
  if (authCodeData.client_id !== client_id) {
    return errorResponse(400, "invalid_grant", "client_id mismatch");
  }
  if (authCodeData.redirect_uri !== redirect_uri) {
    return errorResponse(400, "invalid_grant", "redirect_uri mismatch");
  }

  // Verify PKCE
  const pkceValid = await verifyPkce(code_verifier, authCodeData.code_challenge);
  if (!pkceValid) {
    return errorResponse(400, "invalid_grant", "PKCE verification failed");
  }

  // Auth-only: return profile without access token
  return new Response(
    JSON.stringify({
      me: authCodeData.me,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}

function isValidUrl(str: string): boolean {
  try {
    const url = new URL(str);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function errorResponse(status: number, error: string, description: string): Response {
  return new Response(
    JSON.stringify({ error, error_description: description }),
    { status, headers: { "Content-Type": "application/json" } }
  );
}
