import { NextRequest, NextResponse } from 'next/server';
import { authenticateJWT } from '@/backend/middleware/auth';
import { scheduleService } from '@/backend/services/ScheduleService';

/**
 * GET /api/schedules - List all schedules for current user
 */
export async function GET(req: NextRequest) {
    const authResult = await authenticateJWT(req);
    if (authResult instanceof NextResponse) return authResult;

    try {
        const schedules = await scheduleService.getSchedulesByUser(authResult.user.id);
        return NextResponse.json(schedules);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * POST /api/schedules - Create a new schedule
 */
export async function POST(req: NextRequest) {
    const authResult = await authenticateJWT(req);
    if (authResult instanceof NextResponse) return authResult;

    try {
        const body = await req.json();
        
        // Validate required fields
        if (!body.name || !body.cronExpr || !body.dashboardId || !body.recipients) {
            return NextResponse.json(
                { error: 'Missing required fields: name, cronExpr, dashboardId, recipients' },
                { status: 400 }
            );
        }

        const schedule = await scheduleService.createSchedule({
            userId: authResult.user.id,
            name: body.name,
            cronExpr: body.cronExpr,
            dashboardId: body.dashboardId,
            format: body.format || ['PDF'],
            recipients: body.recipients,
        });

        return NextResponse.json(schedule, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
