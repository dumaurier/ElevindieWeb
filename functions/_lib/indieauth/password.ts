/**
 * Constant-time password comparison using the HMAC equality trick.
 *
 * HMAC both strings with a static key, then XOR the digests.
 * This prevents timing side-channels regardless of input length.
 */
export async function verifyPassword(
  submitted: string,
  stored: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode("indieauth-password-compare"),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const [hmacA, hmacB] = await Promise.all([
    crypto.subtle.sign("HMAC", key, encoder.encode(submitted)),
    crypto.subtle.sign("HMAC", key, encoder.encode(stored)),
  ]);

  const a = new Uint8Array(hmacA);
  const b = new Uint8Array(hmacB);

  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a[i] ^ b[i];
  }
  return mismatch === 0;
}
