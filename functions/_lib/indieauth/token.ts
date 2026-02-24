import type { Env } from "../github/types.js";
import type { AuthCodeData, JwtPayload } from "./types.js";
import { signJwt, verifyJwt } from "./jwt.js";
import { verifyPkce } from "./pkce.js";

const TOKEN_EXPIRY_SECONDS = 30 * 24 * 60 * 60; // 30 days

/**
 * Handle POST /token — routes to exchange, introspection, or revocation.
 * Handle GET /token — introspection via Bearer header (legacy compatibility).
 */
export async function handleTokenRequest(
  request: Request,
  env: Env
): Promise<Response> {
  if (!env.JWT_SECRET || !env.INDIEAUTH_KV) {
    return errorResponse(503, "server_error", "IndieAuth not configured");
  }

  // GET with Bearer header → introspection (legacy pattern)
  if (request.method === "GET") {
    return handleIntrospectionFromHeader(request, env);
  }

  const formData = await request.formData();

  // Revocation: action=revoke
  if (formData.get("action") === "revoke") {
    return handleRevocation(formData, env);
  }

  // Introspection: has "token" field but no grant_type
  if (formData.get("token") && !formData.get("grant_type")) {
    return handleIntrospection(formData.get("token") as string, env);
  }

  // Token exchange: grant_type=authorization_code
  if (formData.get("grant_type") === "authorization_code") {
    return handleTokenExchange(formData, env);
  }

  return errorResponse(400, "unsupported_grant_type", "Unsupported grant_type");
}

/**
 * Exchange authorization code for access token.
 */
async function handleTokenExchange(
  formData: FormData,
  env: Env
): Promise<Response> {
  const code = formData.get("code") as string;
  const client_id = formData.get("client_id") as string;
  const redirect_uri = formData.get("redirect_uri") as string;
  const code_verifier = formData.get("code_verifier") as string;

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

  // No scope → should use auth endpoint, not token endpoint
  if (!authCodeData.scope) {
    return errorResponse(400, "invalid_grant", "No scope was requested. Use the authorization endpoint for authentication-only.");
  }

  // Sign JWT
  const now = Math.floor(Date.now() / 1000);
  const payload: JwtPayload = {
    me: authCodeData.me,
    client_id: authCodeData.client_id,
    scope: authCodeData.scope,
    iat: now,
    exp: now + TOKEN_EXPIRY_SECONDS,
    jti: crypto.randomUUID(),
  };

  const accessToken = await signJwt(payload, env.JWT_SECRET!);

  return new Response(
    JSON.stringify({
      access_token: accessToken,
      token_type: "Bearer",
      scope: authCodeData.scope,
      me: authCodeData.me,
      expires_in: TOKEN_EXPIRY_SECONDS,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}

/**
 * Introspect a token via POST with token= field.
 */
async function handleIntrospection(
  token: string,
  env: Env
): Promise<Response> {
  try {
    const payload = await verifyJwt(token, env.JWT_SECRET!);

    // Check revocation list
    const revoked = await env.INDIEAUTH_KV!.get(`revoked:${payload.jti}`);
    if (revoked !== null) {
      return jsonResponse({ active: false });
    }

    return jsonResponse({
      active: true,
      me: payload.me,
      client_id: payload.client_id,
      scope: payload.scope,
      exp: payload.exp,
      iat: payload.iat,
    });
  } catch {
    return jsonResponse({ active: false });
  }
}

/**
 * Introspect a token via GET with Bearer header (legacy compatibility).
 */
async function handleIntrospectionFromHeader(
  request: Request,
  env: Env
): Promise<Response> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return errorResponse(401, "unauthorized", "Missing Bearer token");
  }

  const token = authHeader.slice(7);
  try {
    const payload = await verifyJwt(token, env.JWT_SECRET!);

    // Check revocation list
    const revoked = await env.INDIEAUTH_KV!.get(`revoked:${payload.jti}`);
    if (revoked !== null) {
      return errorResponse(401, "unauthorized", "Token has been revoked");
    }

    return jsonResponse({
      me: payload.me,
      client_id: payload.client_id,
      scope: payload.scope,
      issued_at: payload.iat,
    });
  } catch {
    return errorResponse(401, "unauthorized", "Invalid or expired token");
  }
}

/**
 * Revoke a token. Always returns 200 per spec.
 */
async function handleRevocation(
  formData: FormData,
  env: Env
): Promise<Response> {
  const token = formData.get("token") as string;
  if (!token) {
    return new Response(null, { status: 200 });
  }

  try {
    const payload = await verifyJwt(token, env.JWT_SECRET!);
    const now = Math.floor(Date.now() / 1000);
    const remainingTtl = payload.exp - now;

    if (remainingTtl > 0) {
      await env.INDIEAUTH_KV!.put(`revoked:${payload.jti}`, "1", {
        expirationTtl: remainingTtl,
      });
    }
  } catch {
    // Token already invalid — nothing to revoke
  }

  return new Response(null, { status: 200 });
}

function errorResponse(status: number, error: string, description: string): Response {
  return new Response(
    JSON.stringify({ error, error_description: description }),
    { status, headers: { "Content-Type": "application/json" } }
  );
}

function jsonResponse(body: object): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
