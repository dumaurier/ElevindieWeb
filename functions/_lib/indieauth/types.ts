/**
 * Data stored in KV alongside each authorization code.
 * Key format: "code:{randomHex}" — TTL: 600 seconds (10 minutes).
 */
export interface AuthCodeData {
  client_id: string;
  redirect_uri: string;
  code_challenge: string;
  code_challenge_method: "S256";
  scope: string;
  me: string;
  created_at: number;
}

/**
 * JWT payload claims for access tokens.
 */
export interface JwtPayload {
  me: string;
  client_id: string;
  scope: string;
  iat: number;
  exp: number;
  jti: string;
}
