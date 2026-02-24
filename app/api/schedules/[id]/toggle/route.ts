import { NextRequest, NextResponse } from 'next/server';
import { authenticateJWT } from '@/backend/middleware/auth';
import { scheduleService } from '@/backend/services/ScheduleService';
import { apiError, hasErrorMessage } from '@/backend/utils/api-error';

/**
 * POST /api/schedules/[id]/toggle - Toggle schedule active status
 */
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const authResult = await authenticateJWT(req);
    if (authResult instanceof NextResponse) return authResult;

    try {
        const { id } = await params;
        const schedule = await scheduleService.toggleSchedule(id, authResult.user.id);
        return NextResponse.json(schedule);
    } catch (error: unknown) {
        if (hasErrorMessage(error, 'Schedule not found')) {
            return apiError(error, { status: 404, request: req });
        }
        if (hasErrorMessage(error, 'Access denied')) {
            return apiError(error, { status: 403, request: req });
        }
        return apiError(error, { status: 500, request: req });
    }
}
