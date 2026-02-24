import { unauthorized, forbidden, insufficientScope } from "./utils/errors.js";
import { verifyJwt } from "./indieauth/jwt.js";

export interface TokenInfo {
  me: string;
  client_id: string;
  scope: string;
  issued_at?: number;
  nonce?: string;
}

/**
 * Verify an access token from the request.
 *
 * If JWT_SECRET is configured, verifies the token locally as a JWT.
 * Otherwise falls back to the external TOKEN_ENDPOINT (indieauth.com).
 */
export async function verifyToken(
  request: Request,
  env: { TOKEN_ENDPOINT: string; ME: string; JWT_SECRET?: string; INDIEAUTH_KV?: KVNamespace }
): Promise<TokenInfo> {
  const token = extractToken(request);
  if (!token) {
    throw unauthorized();
  }

  // Self-hosted: verify JWT locally
  if (env.JWT_SECRET) {
    try {
      const payload = await verifyJwt(token, env.JWT_SECRET);

      // Check revocation list
      if (env.INDIEAUTH_KV) {
        const revoked = await env.INDIEAUTH_KV.get(`revoked:${payload.jti}`);
        if (revoked !== null) {
          throw forbidden("Token has been revoked");
        }
      }

      // Verify identity matches
      const expectedOrigin = new URL(env.ME).origin;
      const actualOrigin = new URL(payload.me).origin;
      if (expectedOrigin !== actualOrigin) {
        throw forbidden("Token identity does not match this site");
      }

      return {
        me: payload.me,
        client_id: payload.client_id,
        scope: payload.scope,
        issued_at: payload.iat,
      };
    } catch (error) {
      // Re-throw our own MicropubErrors
      if (error && typeof error === "object" && "errorType" in error) {
        throw error;
      }
      throw forbidden("Invalid or expired access token");
    }
  }

  // Fallback: external token endpoint
  const response = await fetch(env.TOKEN_ENDPOINT, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw forbidden("Invalid access token");
  }

  const tokenInfo: TokenInfo = await response.json();

  const expectedOrigin = new URL(env.ME).origin;
  const actualOrigin = new URL(tokenInfo.me).origin;
  if (expectedOrigin !== actualOrigin) {
    throw forbidden("Token identity does not match this site");
  }

  return tokenInfo;
}

export function requireScope(tokenInfo: TokenInfo, scope: string): void {
  const scopes = tokenInfo.scope.split(/\s+/);
  if (!scopes.includes(scope)) {
    throw insufficientScope(`This action requires the "${scope}" scope`);
  }
}

function extractToken(request: Request): string | null {
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  const url = new URL(request.url);
  const queryToken = url.searchParams.get("access_token");
  if (queryToken) {
    return queryToken;
  }

  return null;
}
