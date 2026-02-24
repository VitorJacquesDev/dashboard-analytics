import { NextRequest, NextResponse } from 'next/server';
import { authenticateJWT } from '@/backend/middleware/auth';
import { shareService } from '@/backend/services/ShareService';
import { apiError, errorMessageIncludes, hasErrorMessage } from '@/backend/utils/api-error';

/**
 * GET /api/dashboards/[id]/share - List all shares for a dashboard
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const authResult = await authenticateJWT(req);
    if (authResult instanceof NextResponse) return authResult;

    try {
        const { id: dashboardId } = await params;
        const shares = await shareService.getSharedWith(dashboardId, authResult.user.id);
        return NextResponse.json(shares);
    } catch (error: unknown) {
        if (hasErrorMessage(error, 'Dashboard not found')) {
            return apiError(error, { status: 404, request: req });
        }
        if (hasErrorMessage(error, 'Access denied')) {
            return apiError(error, { status: 403, request: req });
        }
        return apiError(error, { status: 500, request: req });
    }
}

/**
 * POST /api/dashboards/[id]/share - Share dashboard with a user
 */
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const authResult = await authenticateJWT(req);
    if (authResult instanceof NextResponse) return authResult;

    try {
        const { id: dashboardId } = await params;
        const body = await req.json();

        if (!body.email && !body.userId) {
            return apiError('Either email or userId is required', { status: 400, request: req });
        }

        const permission = body.permission || 'VIEW';
        if (!['VIEW', 'EDIT'].includes(permission)) {
            return apiError('Permission must be VIEW or EDIT', { status: 400, request: req });
        }

        let share;
        if (body.email) {
            share = await shareService.shareByEmail(
                dashboardId,
                body.email,
                permission,
                authResult.user.id
            );
        } else {
            share = await shareService.share(
                dashboardId,
                body.userId,
                permission,
                authResult.user.id
            );
        }

        return NextResponse.json(share, { status: 201 });
    } catch (error: unknown) {
        if (
            hasErrorMessage(error, 'Dashboard not found') ||
            hasErrorMessage(error, 'User not found') ||
            hasErrorMessage(error, 'User with this email not found')
        ) {
            return apiError(error, { status: 404, request: req });
        }
        if (errorMessageIncludes(error, 'Only dashboard owner') || errorMessageIncludes(error, 'Cannot share')) {
            return apiError(error, { status: 403, request: req });
        }
        return apiError(error, { status: 400, request: req });
    }
}

/**
 * DELETE /api/dashboards/[id]/share - Revoke access (requires userId in query)
 */
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const authResult = await authenticateJWT(req);
    if (authResult instanceof NextResponse) return authResult;

    try {
        const { id: dashboardId } = await params;
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return apiError('userId query parameter is required', { status: 400, request: req });
        }

        await shareService.revoke(dashboardId, userId, authResult.user.id);
        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        if (hasErrorMessage(error, 'Dashboard not found') || hasErrorMessage(error, 'Share not found')) {
            return apiError(error, { status: 404, request: req });
        }
        if (errorMessageIncludes(error, 'Only dashboard owner')) {
            return apiError(error, { status: 403, request: req });
        }
        return apiError(error, { status: 500, request: req });
    }
}
