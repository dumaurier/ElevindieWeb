import { unauthorized, forbidden, insufficientScope } from "./utils/errors.js";

export interface TokenInfo {
  me: string;
  client_id: string;
  scope: string;
  issued_at?: number;
  nonce?: string;
}

export async function verifyToken(
  request: Request,
  env: { TOKEN_ENDPOINT: string; ME: string }
): Promise<TokenInfo> {
  const token = extractToken(request);
  if (!token) {
    throw unauthorized();
  }

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
