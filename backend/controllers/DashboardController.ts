import { NextRequest, NextResponse } from 'next/server';
import { dashboardService } from '@/backend/services/DashboardService';
import { authenticateJWT } from '@/backend/middleware/auth';
import { apiError, errorMessageIncludes, hasErrorMessage } from '@/backend/utils/api-error';
import { parseJsonBody } from '@/backend/validation/request';
import { dashboardCreateSchema, dashboardUpdateSchema } from '@/backend/validation/schemas';

export class DashboardController {
    /**
     * Create a new dashboard
     */
    async create(req: NextRequest) {
        const authResult = await authenticateJWT(req);
        if (authResult instanceof NextResponse) return authResult;

        try {
            const body = await parseJsonBody(req, dashboardCreateSchema);
            const dashboard = await dashboardService.createDashboard({
                ...body,
                userId: authResult.user.id,
            });
            return NextResponse.json(dashboard, { status: 201 });
        } catch (error: unknown) {
            return apiError(error, { status: 400, request: req });
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
        } catch (error: unknown) {
            return apiError(error, { status: 500, request: req });
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
                return apiError('Access denied', { status: 403, request: req });
            }

            return NextResponse.json(dashboard);
        } catch (error: unknown) {
            if (hasErrorMessage(error, 'Dashboard not found')) {
                return apiError(error, { status: 404, request: req });
            }
            return apiError(error, { status: 500, request: req });
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
            const body = await parseJsonBody(req, dashboardUpdateSchema);

            // Verify permission
            await dashboardService.verifyModifyPermission(id, authResult.user.id);

            const dashboard = await dashboardService.updateDashboard(id, body);
            return NextResponse.json(dashboard);
        } catch (error: unknown) {
            if (hasErrorMessage(error, 'Access denied') || errorMessageIncludes(error, 'Insufficient permissions')) {
                return apiError(error, { status: 403, request: req });
            }
            if (hasErrorMessage(error, 'Dashboard not found')) {
                return apiError(error, { status: 404, request: req });
            }
            return apiError(error, { status: 400, request: req });
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
        } catch (error: unknown) {
            if (hasErrorMessage(error, 'Access denied') || errorMessageIncludes(error, 'Only dashboard owner')) {
                return apiError(error, { status: 403, request: req });
            }
            if (hasErrorMessage(error, 'Dashboard not found')) {
                return apiError(error, { status: 404, request: req });
            }
            return apiError(error, { status: 500, request: req });
        }
    }
}

export const dashboardController = new DashboardController();
