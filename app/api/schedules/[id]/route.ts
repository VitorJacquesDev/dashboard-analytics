import { NextRequest, NextResponse } from 'next/server';
import { authenticateJWT } from '@/backend/middleware/auth';
import { scheduleService } from '@/backend/services/ScheduleService';

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
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        return NextResponse.json(schedule);
    } catch (error: any) {
        if (error.message === 'Schedule not found') {
            return NextResponse.json({ error: error.message }, { status: 404 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
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
        const body = await req.json();

        const schedule = await scheduleService.updateSchedule(id, authResult.user.id, body);
        return NextResponse.json(schedule);
    } catch (error: any) {
        if (error.message === 'Schedule not found') {
            return NextResponse.json({ error: error.message }, { status: 404 });
        }
        if (error.message === 'Access denied') {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }
        return NextResponse.json({ error: error.message }, { status: 400 });
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
    } catch (error: any) {
        if (error.message === 'Schedule not found') {
            return NextResponse.json({ error: error.message }, { status: 404 });
        }
        if (error.message === 'Access denied') {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
