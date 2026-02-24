import type { JwtPayload } from "./types.js";

/**
 * Base64url encode an ArrayBuffer (no padding, URL-safe).
 */
export function base64urlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Base64url decode a string to Uint8Array.
 */
function base64urlDecode(str: string): Uint8Array {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Import a secret string as an HMAC-SHA256 CryptoKey.
 */
async function getSigningKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

/**
 * Sign a JWT payload with HMAC-SHA256. Returns the complete token string.
 */
export async function signJwt(payload: JwtPayload, secret: string): Promise<string> {
  const header = base64urlEncode(
    new TextEncoder().encode(JSON.stringify({ alg: "HS256", typ: "JWT" }))
  );
  const body = base64urlEncode(
    new TextEncoder().encode(JSON.stringify(payload))
  );

  const data = new TextEncoder().encode(`${header}.${body}`);
  const key = await getSigningKey(secret);
  const signature = await crypto.subtle.sign("HMAC", key, data);

  return `${header}.${body}.${base64urlEncode(signature)}`;
}

/**
 * Verify and decode a JWT. Returns the payload if valid, throws if not.
 *
 * Uses crypto.subtle.verify for constant-time signature comparison.
 */
export async function verifyJwt(token: string, secret: string): Promise<JwtPayload> {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid JWT format");
  }

  const [header, body, sig] = parts;
  const data = new TextEncoder().encode(`${header}.${body}`);
  const signature = base64urlDecode(sig);

  const key = await getSigningKey(secret);
  const valid = await crypto.subtle.verify("HMAC", key, signature, data);

  if (!valid) {
    throw new Error("Invalid JWT signature");
  }

  const payload: JwtPayload = JSON.parse(
    new TextDecoder().decode(base64urlDecode(body))
  );

  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now) {
    throw new Error("JWT expired");
  }

  return payload;
}
