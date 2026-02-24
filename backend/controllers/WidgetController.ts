import { NextRequest, NextResponse } from 'next/server';
import { widgetService } from '@/backend/services/WidgetService';
import { dashboardService } from '@/backend/services/DashboardService';
import { authenticateJWT } from '@/backend/middleware/auth';
import { apiError, errorMessageIncludes, hasErrorMessage } from '@/backend/utils/api-error';
import { parseJsonBody } from '@/backend/validation/request';
import { widgetCreateSchema, widgetUpdateSchema } from '@/backend/validation/schemas';

export class WidgetController {
    /**
     * Create a new widget
     */
    async create(req: NextRequest) {
        const authResult = await authenticateJWT(req);
        if (authResult instanceof NextResponse) return authResult;

        try {
            const body = await parseJsonBody(req, widgetCreateSchema);

            // Creating a widget always requires write access, not just visibility.
            await dashboardService.verifyModifyPermission(body.dashboardId, authResult.user.id);

            const widget = await widgetService.createWidget(body);
            return NextResponse.json(widget, { status: 201 });
        } catch (error: unknown) {
            if (hasErrorMessage(error, 'Access denied') || errorMessageIncludes(error, 'Insufficient permissions')) {
                return apiError(error, { status: 403, request: req });
            }
            return apiError(error, { status: 400, request: req });
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
                    return apiError('Access denied', { status: 403, request: req });
                }
            }

            const widgets = await widgetService.getWidgetsByDashboard(id);
            return NextResponse.json(widgets);
        } catch (error: unknown) {
            return apiError(error, { status: 500, request: req });
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
            const body = await parseJsonBody(req, widgetUpdateSchema);

            // Get widget to find dashboardId
            const widget = await widgetService.getWidgetById(id);

            // Verify permission on dashboard
            await dashboardService.verifyModifyPermission(widget.dashboardId, authResult.user.id);

            const updatedWidget = await widgetService.updateWidget(id, body);
            return NextResponse.json(updatedWidget);
        } catch (error: unknown) {
            if (hasErrorMessage(error, 'Widget not found')) {
                return apiError(error, { status: 404, request: req });
            }
            if (hasErrorMessage(error, 'Access denied') || errorMessageIncludes(error, 'Insufficient permissions')) {
                return apiError(error, { status: 403, request: req });
            }
            return apiError(error, { status: 400, request: req });
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
        } catch (error: unknown) {
            if (hasErrorMessage(error, 'Widget not found')) {
                return apiError(error, { status: 404, request: req });
            }
            if (hasErrorMessage(error, 'Access denied') || errorMessageIncludes(error, 'Insufficient permissions')) {
                return apiError(error, { status: 403, request: req });
            }
            return apiError(error, { status: 500, request: req });
        }
    }

    /**
     * Get widget data
     */
    async getData(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
        const authResult = await authenticateJWT(req);
        if (authResult instanceof NextResponse) return authResult;

        try {
            const { id } = await params;
            const widget = await widgetService.getWidgetById(id);

            // Check access to dashboard
            const hasAccess = await dashboardService.hasAccess(widget.dashboardId, authResult.user.id);
            if (!hasAccess) {
                const dashboard = await dashboardService.getDashboardById(widget.dashboardId);
                if (!dashboard.isPublic) {
                    return apiError('Access denied', { status: 403, request: req });
                }
            }

            const data = await widgetService.getWidgetData(id);
            return NextResponse.json(data);
        } catch (error: unknown) {
            if (hasErrorMessage(error, 'Widget not found')) {
                return apiError(error, { status: 404, request: req });
            }
            return apiError(error, { status: 500, request: req });
        }
    }
}

export const widgetController = new WidgetController();
