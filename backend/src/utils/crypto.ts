import { createHash, randomBytes } from 'node:crypto';

/**
 * Creates a random single-use token. The raw token is sent to the user (e.g.
 * via email) while only its SHA-256 hash is persisted, so a database leak does
 * not expose usable tokens.
 */
export function createSecureToken(): { token: string; hashedToken: string } {
  const token = randomBytes(32).toString('hex');
  return { token, hashedToken: hashToken(token) };
}

/** Returns the SHA-256 hash of a token for storage/lookup. */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
