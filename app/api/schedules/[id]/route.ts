import { NextRequest, NextResponse } from 'next/server';
import { authenticateJWT } from '@/backend/middleware/auth';
import { scheduleService } from '@/backend/services/ScheduleService';
import { apiError, hasErrorMessage } from '@/backend/utils/api-error';
import { parseJsonBody } from '@/backend/validation/request';
import { scheduleUpdateSchema } from '@/backend/validation/schemas';

/**
 * GET /api/schedules/[id] - Get a specific schedule
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const authResult = await authenticateJWT(req);
    if (authResult instanceof NextResponse) return authResult;

    try {
        const { id } = await params;
        const schedule = await scheduleService.getScheduleById(id);

        // Verify ownership
        if (schedule.userId !== authResult.user.id) {
            return apiError('Access denied', { status: 403, request: req });
        }

        return NextResponse.json(schedule);
    } catch (error: unknown) {
        if (hasErrorMessage(error, 'Schedule not found')) {
            return apiError(error, { status: 404, request: req });
        }
        return apiError(error, { status: 500, request: req });
    }
}

/**
 * PATCH /api/schedules/[id] - Update a schedule (including pause/resume)
 */
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const authResult = await authenticateJWT(req);
    if (authResult instanceof NextResponse) return authResult;

    try {
        const { id } = await params;
        const body = await parseJsonBody(req, scheduleUpdateSchema);

        const schedule = await scheduleService.updateSchedule(id, authResult.user.id, body);
        return NextResponse.json(schedule);
    } catch (error: unknown) {
        if (hasErrorMessage(error, 'Schedule not found')) {
            return apiError(error, { status: 404, request: req });
        }
        if (hasErrorMessage(error, 'Access denied')) {
            return apiError(error, { status: 403, request: req });
        }
        return apiError(error, { status: 400, request: req });
    }
}

/**
 * DELETE /api/schedules/[id] - Delete a schedule
 */
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const authResult = await authenticateJWT(req);
    if (authResult instanceof NextResponse) return authResult;

    try {
        const { id } = await params;
        await scheduleService.deleteSchedule(id, authResult.user.id);
        return NextResponse.json({ success: true });
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
