import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/backend/services/AuthService';
import { userService } from '@/backend/services/UserService';
import { authenticateJWT } from '@/backend/middleware/auth';
import { apiError } from '@/backend/utils/api-error';
import { parseJsonBody } from '@/backend/validation/request';
import { authLoginSchema, authRegisterSchema } from '@/backend/validation/schemas';
import { setAuthCookie } from '@/lib/auth-cookie';
import { AuthToken } from '@/lib/types';

function createSessionResponse(authToken: AuthToken, status = 200) {
    const { token, ...session } = authToken;
    const response = NextResponse.json(session, { status });
    setAuthCookie(response, token);
    return response;
}

export class AuthController {
    /**
     * Register a new user
     */
    async register(req: NextRequest) {
        try {
            const body = await parseJsonBody(req, authRegisterSchema);

            // Create user
            await userService.createUser(body);

            // Auto login after registration
            const authToken = await authService.login(body.email, body.password);

            return createSessionResponse(authToken, 201);
        } catch (error: unknown) {
            return apiError(error, { status: 400, request: req });
        }
    }

    /**
     * Login user
     */
    async login(req: NextRequest) {
        try {
            const body = await parseJsonBody(req, authLoginSchema);
            const authToken = await authService.login(body.email, body.password);
            return createSessionResponse(authToken);
        } catch (error: unknown) {
            return apiError(error, { status: 401, code: 'UNAUTHORIZED', request: req });
        }
    }

    /**
     * Get current user
     */
    async me(req: NextRequest) {
        const authResult = await authenticateJWT(req);
        if (authResult instanceof NextResponse) return authResult;

        return NextResponse.json(authResult.user);
    }
}

export const authController = new AuthController();
