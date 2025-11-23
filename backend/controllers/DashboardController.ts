import { NextRequest, NextResponse } from 'next/server';
import { dashboardService } from '@/backend/services/DashboardService';
import { authenticateJWT } from '@/backend/middleware/auth';

export class DashboardController {
    /**
     * Create a new dashboard
     */
    async create(req: NextRequest) {
        const authResult = await authenticateJWT(req);
        if (authResult instanceof NextResponse) return authResult;

        try {
            const body = await req.json();
            const dashboard = await dashboardService.createDashboard({
                ...body,
                userId: authResult.user.id,
            });
            return NextResponse.json(dashboard, { status: 201 });
        } catch (error: any) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
    }

    /**
     * Get all dashboards for the current user
     */
    async getAll(req: NextRequest) {
        const authResult = await authenticateJWT(req);
        if (authResult instanceof NextResponse) return authResult;

        try {
            const dashboards = await dashboardService.getDashboardsByUser(authResult.user.id);
            return NextResponse.json(dashboards);
        } catch (error: any) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
    }

    /**
     * Get a single dashboard by ID
     */
    async getOne(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
        const authResult = await authenticateJWT(req);
        if (authResult instanceof NextResponse) return authResult;

        try {
            const { id } = await params;
            const dashboard = await dashboardService.getDashboardById(id, true);

            // Check access
            const hasAccess = await dashboardService.hasAccess(id, authResult.user.id);
            if (!hasAccess && dashboard.userId !== authResult.user.id && !dashboard.isPublic) {
                return NextResponse.json({ error: 'Access denied' }, { status: 403 });
            }

            return NextResponse.json(dashboard);
        } catch (error: any) {
            if (error.message === 'Dashboard not found') {
                return NextResponse.json({ error: error.message }, { status: 404 });
            }
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
    }

    /**
     * Update a dashboard
     */
    async update(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
        const authResult = await authenticateJWT(req);
        if (authResult instanceof NextResponse) return authResult;

        try {
            const { id } = await params;
            const body = await req.json();

            // Verify permission
            await dashboardService.verifyModifyPermission(id, authResult.user.id);

            const dashboard = await dashboardService.updateDashboard(id, body);
            return NextResponse.json(dashboard);
        } catch (error: any) {
            if (error.message === 'Access denied' || error.message.includes('Insufficient permissions')) {
                return NextResponse.json({ error: error.message }, { status: 403 });
            }
            if (error.message === 'Dashboard not found') {
                return NextResponse.json({ error: error.message }, { status: 404 });
            }
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
    }

    /**
     * Delete a dashboard
     */
    async delete(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
        const authResult = await authenticateJWT(req);
        if (authResult instanceof NextResponse) return authResult;

        try {
            const { id } = await params;

            // Verify permission
            await dashboardService.verifyDeletePermission(id, authResult.user.id);

            await dashboardService.deleteDashboard(id);
            return NextResponse.json({ success: true });
        } catch (error: any) {
            if (error.message === 'Access denied' || error.message.includes('Only dashboard owner')) {
                return NextResponse.json({ error: error.message }, { status: 403 });
            }
            if (error.message === 'Dashboard not found') {
                return NextResponse.json({ error: error.message }, { status: 404 });
            }
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
    }
}

export const dashboardController = new DashboardController();
