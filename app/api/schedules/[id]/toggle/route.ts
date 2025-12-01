import { NextRequest, NextResponse } from 'next/server';
import { authenticateJWT } from '@/backend/middleware/auth';
import { scheduleService } from '@/backend/services/ScheduleService';

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
