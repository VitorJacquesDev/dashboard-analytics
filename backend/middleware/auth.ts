import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/backend/services/AuthService';
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
    const token = authService.extractTokenFromHeader(authHeader);

    if (!token) {
      return NextResponse.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: 'No token provided',
            timestamp: new Date().toISOString(),
            requestId: crypto.randomUUID(),
          },
        },
        { status: 401 }
      );
    }

    // Validate token and get user
    const user = await authService.validateToken(token);

    return { user };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Authentication failed';
    return NextResponse.json(
      {
        error: {
          code: 'UNAUTHORIZED',
          message,
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID(),
        },
      },
      { status: 401 }
    );
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
      return NextResponse.json(
        {
          error: {
            code: 'FORBIDDEN',
            message: 'Insufficient permissions',
            timestamp: new Date().toISOString(),
            requestId: crypto.randomUUID(),
          },
        },
        { status: 403 }
      );
    }

    return true;
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: 'FORBIDDEN',
          message: 'Permission check failed',
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID(),
        },
      },
      { status: 403 }
    );
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
