import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

/**
 * Sign an access token (short lived)
 */
export function signAccessToken(userId: string) {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: "15m" });
}

/**
 * Verify an access token. Throws on invalid/expired token.
 */
export function verifyAccessToken(token: string) {
  return jwt.verify(token, JWT_SECRET) as { sub: string; iat: number; exp: number };
}
