import { NextRequest, NextResponse } from 'next/server';
import { ExportFormat } from '@prisma/client';
import { authenticateJWT } from '@/backend/middleware/auth';
import { scheduleService } from '@/backend/services/ScheduleService';
import { apiError } from '@/backend/utils/api-error';
import { parseJsonBody } from '@/backend/validation/request';
import { scheduleCreateSchema } from '@/backend/validation/schemas';

/**
 * GET /api/schedules - List all schedules for current user
 */
export async function GET(req: NextRequest) {
    const authResult = await authenticateJWT(req);
    if (authResult instanceof NextResponse) return authResult;

    try {
        const schedules = await scheduleService.getSchedulesByUser(authResult.user.id);
        return NextResponse.json(schedules);
    } catch (error: unknown) {
        return apiError(error, { status: 500, request: req });
    }
}

/**
 * POST /api/schedules - Create a new schedule
 */
export async function POST(req: NextRequest) {
    const authResult = await authenticateJWT(req);
    if (authResult instanceof NextResponse) return authResult;

    try {
        const body = await parseJsonBody(req, scheduleCreateSchema);

        const schedule = await scheduleService.createSchedule({
            userId: authResult.user.id,
            name: body.name,
            cronExpr: body.cronExpr,
            dashboardId: body.dashboardId,
            format: body.format ?? [ExportFormat.PDF],
            recipients: body.recipients,
        });

        return NextResponse.json(schedule, { status: 201 });
    } catch (error: unknown) {
        return apiError(error, { status: 400, request: req });
    }
}
