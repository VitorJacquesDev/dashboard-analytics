import { NextRequest, NextResponse } from 'next/server';
import { authenticateJWT } from '@/backend/middleware/auth';
import { shareService } from '@/backend/services/ShareService';
import { apiError } from '@/backend/utils/api-error';

/**
 * GET /api/dashboards/shared - Get all dashboards shared with current user
 */
export async function GET(req: NextRequest) {
    const authResult = await authenticateJWT(req);
    if (authResult instanceof NextResponse) return authResult;

    try {
        const dashboards = await shareService.getSharedToMe(authResult.user.id);
        return NextResponse.json(dashboards);
    } catch (error: unknown) {
        return apiError(error, { status: 500, request: req });
    }
}
