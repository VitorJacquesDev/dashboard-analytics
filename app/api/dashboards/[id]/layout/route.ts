import { NextRequest, NextResponse } from 'next/server';
import { authenticateJWT } from '@/backend/middleware/auth';
import { layoutService } from '@/backend/services/LayoutService';
import { dashboardService } from '@/backend/services/DashboardService';
import { apiError, errorMessageIncludes, hasErrorMessage } from '@/backend/utils/api-error';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const authResult = await authenticateJWT(req);
    if (authResult instanceof NextResponse) return authResult;

    try {
        const { id: dashboardId } = await params;
        const body = await req.json();
        const { layout } = body;

        if (!layout) {
            return apiError('Layout is required', { status: 400, request: req });
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
    } catch (error: unknown) {
        if (hasErrorMessage(error, 'Access denied') || errorMessageIncludes(error, 'Insufficient permissions')) {
            return apiError(error, { status: 403, request: req });
        }
        if (hasErrorMessage(error, 'Dashboard not found')) {
            return apiError(error, { status: 404, request: req });
        }
        return apiError(error, { status: 500, request: req });
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
            return apiError('Access denied', { status: 403, request: req });
        }

        const layout = await layoutService.getLayoutByUserAndDashboard(
            authResult.user.id,
            dashboardId
        );

        if (!layout) {
            return NextResponse.json({ layout: null });
        }

        return NextResponse.json(layout);
    } catch (error: unknown) {
        return apiError(error, { status: 500, request: req });
    }
}
