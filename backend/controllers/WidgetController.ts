import { NextRequest, NextResponse } from 'next/server';
import { widgetService } from '@/backend/services/WidgetService';
import { dashboardService } from '@/backend/services/DashboardService';
import { authenticateJWT } from '@/backend/middleware/auth';

export class WidgetController {
    /**
     * Create a new widget
     */
    async create(req: NextRequest) {
        const authResult = await authenticateJWT(req);
        if (authResult instanceof NextResponse) return authResult;

        try {
            const body = await req.json();

            // Verify user has access to the dashboard
            const hasAccess = await dashboardService.hasAccess(body.dashboardId, authResult.user.id);
            if (!hasAccess) {
                // Also check modify permission specifically
                await dashboardService.verifyModifyPermission(body.dashboardId, authResult.user.id);
            }

            const widget = await widgetService.createWidget(body);
            return NextResponse.json(widget, { status: 201 });
        } catch (error: any) {
            if (error.message === 'Access denied' || error.message.includes('Insufficient permissions')) {
                return NextResponse.json({ error: error.message }, { status: 403 });
            }
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
    }

    /**
     * Get all widgets for a dashboard
     */
    async getByDashboard(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
        const authResult = await authenticateJWT(req);
        if (authResult instanceof NextResponse) return authResult;

        try {
            const { id } = await params; // dashboardId

            // Check access
            const hasAccess = await dashboardService.hasAccess(id, authResult.user.id);
            if (!hasAccess) {
                // Check if public
                const dashboard = await dashboardService.getDashboardById(id);
                if (!dashboard.isPublic) {
                    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
                }
            }

            const widgets = await widgetService.getWidgetsByDashboard(id);
            return NextResponse.json(widgets);
        } catch (error: any) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
    }

    /**
     * Update a widget
     */
    async update(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
        const authResult = await authenticateJWT(req);
        if (authResult instanceof NextResponse) return authResult;

        try {
            const { id } = await params;
            const body = await req.json();

            // Get widget to find dashboardId
            const widget = await widgetService.getWidgetById(id);

            // Verify permission on dashboard
            await dashboardService.verifyModifyPermission(widget.dashboardId, authResult.user.id);

            const updatedWidget = await widgetService.updateWidget(id, body);
            return NextResponse.json(updatedWidget);
        } catch (error: any) {
            if (error.message === 'Widget not found') {
                return NextResponse.json({ error: error.message }, { status: 404 });
            }
            if (error.message === 'Access denied' || error.message.includes('Insufficient permissions')) {
                return NextResponse.json({ error: error.message }, { status: 403 });
            }
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
    }

    /**
     * Delete a widget
     */
    async delete(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
        const authResult = await authenticateJWT(req);
        if (authResult instanceof NextResponse) return authResult;

        try {
            const { id } = await params;

            // Get widget to find dashboardId
            const widget = await widgetService.getWidgetById(id);

            // Verify permission on dashboard
            await dashboardService.verifyModifyPermission(widget.dashboardId, authResult.user.id);

            await widgetService.deleteWidget(id);
            return NextResponse.json({ success: true });
        } catch (error: any) {
            if (error.message === 'Widget not found') {
                return NextResponse.json({ error: error.message }, { status: 404 });
            }
            if (error.message === 'Access denied' || error.message.includes('Insufficient permissions')) {
                return NextResponse.json({ error: error.message }, { status: 403 });
            }
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
    }
}

export const widgetController = new WidgetController();
