import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/backend/services/AuthService';
import { apiError } from '@/backend/utils/api-error';
import { getAuthTokenFromCookie } from '@/lib/auth-cookie';
import { User } from '@/lib/types';

export interface AuthenticatedRequest extends NextRequest {
  user?: User;
}

/**
 * Middleware to authenticate JWT tokens
 * Extracts token from Authorization header, validates it, and attaches user to request
 */
export async function authenticateJWT(
  request: NextRequest
): Promise<{ user: User } | NextResponse> {
  try {
    // Extract token from Authorization header
    const authHeader = request.headers.get('authorization');
    const token =
      authService.extractTokenFromHeader(authHeader) ?? getAuthTokenFromCookie(request);

    if (!token) {
      return apiError('No token provided', {
        status: 401,
        code: 'UNAUTHORIZED',
        request,
      });
    }

    // Validate token and get user
    const user = await authService.validateToken(token);

    return { user };
  } catch (error) {
    return apiError(error, {
      status: 401,
      code: 'UNAUTHORIZED',
      request,
    });
  }
}

/**
 * Middleware to check if user has required permission
 * Must be used after authenticateJWT
 */
export async function requirePermission(
  user: User,
  resource: string,
  action: string
): Promise<true | NextResponse> {
  try {
    const hasPermission = await authService.checkPermission(user.id, resource, action);

    if (!hasPermission) {
      return apiError('Insufficient permissions', {
        status: 403,
        code: 'FORBIDDEN',
      });
    }

    return true;
  } catch (error) {
    return apiError('Permission check failed', {
      status: 403,
      code: 'FORBIDDEN',
    });
  }
}

/**
 * Helper function to combine authentication and permission check
 */
export async function authenticateAndAuthorize(
  request: NextRequest,
  resource: string,
  action: string
): Promise<{ user: User } | NextResponse> {
  // First authenticate
  const authResult = await authenticateJWT(request);

  // If authentication failed, return error response
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  // Check permission
  const permissionResult = await requirePermission(authResult.user, resource, action);

  // If permission check failed, return error response
  if (permissionResult instanceof NextResponse) {
    return permissionResult;
  }

  // Return authenticated user
  return authResult;
}
