import { NextRequest, NextResponse } from 'next/server';
import { authenticateJWT } from '@/backend/middleware/auth';
import { layoutService } from '@/backend/services/LayoutService';
import { dashboardService } from '@/backend/services/DashboardService';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const authResult = await authenticateJWT(req);
    if (authResult instanceof NextResponse) return authResult;

    try {
        const { id: dashboardId } = await params;
        const body = await req.json();
        const { layout } = body;

        if (!layout) {
            return NextResponse.json({ error: 'Layout is required' }, { status: 400 });
        }

        // Verify user has access to modify this dashboard
        await dashboardService.verifyModifyPermission(dashboardId, authResult.user.id);

        // Update or create layout
        const updatedLayout = await layoutService.upsertLayout(
            authResult.user.id,
            dashboardId,
            { layout }
        );

        return NextResponse.json(updatedLayout);
    } catch (error: any) {
        if (error.message === 'Access denied' || error.message.includes('Insufficient permissions')) {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }
        if (error.message === 'Dashboard not found') {
            return NextResponse.json({ error: error.message }, { status: 404 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const authResult = await authenticateJWT(req);
    if (authResult instanceof NextResponse) return authResult;

    try {
        const { id: dashboardId } = await params;

        // Verify user has access to this dashboard
        const hasAccess = await dashboardService.hasAccess(dashboardId, authResult.user.id);
        if (!hasAccess) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        const layout = await layoutService.getLayoutByUserAndDashboard(
            authResult.user.id,
            dashboardId
        );

        if (!layout) {
            return NextResponse.json({ layout: null });
        }

        return NextResponse.json(layout);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
