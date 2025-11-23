import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/backend/services/AuthService';
import { userService } from '@/backend/services/UserService';
import { authenticateJWT } from '@/backend/middleware/auth';

export class AuthController {
    /**
     * Register a new user
     */
    async register(req: NextRequest) {
        try {
            const body = await req.json();

            // Create user
            await userService.createUser(body);

            // Auto login after registration
            const token = await authService.login(body.email, body.password);

            return NextResponse.json(token, { status: 201 });
        } catch (error: any) {
            return NextResponse.json(
                { error: error.message },
                { status: 400 }
            );
        }
    }

    /**
     * Login user
     */
    async login(req: NextRequest) {
        try {
            const body = await req.json();
            const token = await authService.login(body.email, body.password);
            return NextResponse.json(token);
        } catch (error: any) {
            return NextResponse.json(
                { error: error.message },
                { status: 401 }
            );
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
