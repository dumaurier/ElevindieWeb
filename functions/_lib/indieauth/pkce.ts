import { base64urlEncode } from "./jwt.js";

/**
 * Verify a PKCE code_verifier against the stored code_challenge using S256.
 *
 * Per RFC 7636: code_challenge = BASE64URL(SHA256(code_verifier))
 */
export async function verifyPkce(
  codeVerifier: string,
  codeChallenge: string
): Promise<boolean> {
  const hash = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(codeVerifier)
  );
  const computed = base64urlEncode(hash);
  return computed === codeChallenge;
}
