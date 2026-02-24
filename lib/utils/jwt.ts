import jwt from 'jsonwebtoken';
import { Role } from '@/lib/types';

const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '24h';

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required');
  }

  return secret;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: Role;
  iat?: number;
  exp?: number;
}

/**
 * Generate a JWT token for a user
 * @param payload - User information to encode in the token
 * @returns JWT token string
 */
export function generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: JWT_EXPIRATION as jwt.SignOptions['expiresIn'],
  });
}

/**
 * Verify and decode a JWT token
 * @param token - JWT token string
 * @returns Decoded payload if valid
 * @throws Error if token is invalid or expired
 */
export function verifyToken(token: string): JWTPayload {
  try {
    return jwt.verify(token, getJwtSecret()) as JWTPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    }
    throw new Error('Token verification failed');
  }
}

/**
 * Decode a JWT token without verification (for debugging)
 * @param token - JWT token string
 * @returns Decoded payload or null if invalid
 */
export function decodeToken(token: string): JWTPayload | null {
  try {
    return jwt.decode(token) as JWTPayload;
  } catch {
    return null;
  }
}
