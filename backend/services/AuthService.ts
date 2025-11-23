import { PrismaClient, Role } from '@prisma/client';
import { comparePassword } from '@/lib/utils/password';
import { generateToken, verifyToken, JWTPayload } from '@/lib/utils/jwt';
import { AuthToken, User } from '@/lib/types';

const prisma = new PrismaClient();

export class AuthService {
  /**
   * Authenticate a user with email and password
   * @param email - User email
   * @param password - Plain text password
   * @returns Authentication token and user information
   * @throws Error if credentials are invalid
   */
  async login(email: string, password: string): Promise<AuthToken> {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role as Role,
    });

    // Return token and user info (without password)
    return {
      token,
      expiresIn: process.env.JWT_EXPIRATION || '24h',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role as Role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  }

  /**
   * Validate a JWT token and return user information
   * @param token - JWT token string
   * @returns User information if token is valid
   * @throws Error if token is invalid or user not found
   */
  async validateToken(token: string): Promise<User> {
    // Verify token
    const payload = verifyToken(token);

    // Find user in database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as Role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Check if a user has permission to perform an action on a resource
   * @param userId - User ID
   * @param resource - Resource type (e.g., 'dashboard', 'widget', 'user')
   * @param action - Action type (e.g., 'create', 'read', 'update', 'delete')
   * @returns True if user has permission, false otherwise
   */
  async checkPermission(
    userId: string,
    resource: string,
    action: string
  ): Promise<boolean> {
    // Get user role
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      return false;
    }

    const role = user.role as Role;

    // Admin has all permissions
    if (role === Role.ADMIN) {
      return true;
    }

    // Analyst permissions
    if (role === Role.ANALYST) {
      // Analysts can create, read, update, and delete dashboards and widgets
      if (resource === 'dashboard' || resource === 'widget') {
        return ['create', 'read', 'update', 'delete'].includes(action);
      }
      // Analysts can read users but not manage them
      if (resource === 'user') {
        return action === 'read';
      }
      // Analysts can create and manage reports
      if (resource === 'report' || resource === 'schedule') {
        return ['create', 'read', 'update', 'delete'].includes(action);
      }
    }

    // Viewer permissions
    if (role === Role.VIEWER) {
      // Viewers can only read dashboards and widgets
      if (resource === 'dashboard' || resource === 'widget') {
        return action === 'read';
      }
      // Viewers cannot access user management
      if (resource === 'user') {
        return false;
      }
      // Viewers cannot create or manage reports
      if (resource === 'report' || resource === 'schedule') {
        return action === 'read';
      }
    }

    return false;
  }

  /**
   * Extract token from Authorization header
   * @param authHeader - Authorization header value
   * @returns Token string or null if not found
   */
  extractTokenFromHeader(authHeader: string | null | undefined): string | null {
    if (!authHeader) {
      return null;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }

    const token = parts[1];
    // Ensure token is not empty and contains no whitespace
    // JWT tokens should not have any whitespace characters
    if (!token || /\s/.test(token)) {
      return null;
    }

    return token;
  }
}

export const authService = new AuthService();
