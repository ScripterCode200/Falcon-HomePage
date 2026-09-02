import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'falcon_fallback_secure_key_365d';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '365d';

export interface TokenPayload {
  userId: string;
  email: string;
  name: string;
}

/**
 * Generate a JWT token with 1-year validity (365 days)
 */
export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN as any,
  });
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    return null;
  }
}
