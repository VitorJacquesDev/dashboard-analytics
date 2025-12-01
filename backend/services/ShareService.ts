import { PrismaClient, Permission } from '@prisma/client';

interface ShareResult {
    id: string;
    dashboardId: string;
    userId: string;
    permission: Permission;
    createdAt: Date;
    user?: {
        id: string;
        name: string;
        email: string;
    };
}

/**
 * ShareService - Business logic for dashboard sharing
 */
export class ShareService {
    private prisma: PrismaClient;

    constructor(prisma?: PrismaClient) {
        this.prisma = prisma || new PrismaClient();
    }

    /**
     * Share a dashboard with a user
     */
    async share(
        dashboardId: string,
        targetUserId: string,
        permission: 'VIEW' | 'EDIT',
        ownerId: string
    ): Promise<ShareResult> {
        // Verify dashboard exists and user is owner
        const dashboard = await this.prisma.dashboard.findUnique({
            where: { id: dashboardId },
        });

        if (!dashboard) {
            throw new Error('Dashboard not found');
        }

        if (dashboard.userId !== ownerId) {
            throw new Error('Only dashboard owner can share');
        }

        // Cannot share with yourself
        if (targetUserId === ownerId) {
            throw new Error('Cannot share dashboard with yourself');
        }

        // Verify target user exists
        const targetUser = await this.prisma.user.findUnique({
            where: { id: targetUserId },
        });

        if (!targetUser) {
            throw new Error('User not found');
        }

        // Create or update share
        const share = await this.prisma.dashboardShare.upsert({
            where: {
                dashboardId_userId: {
                    dashboardId,
                    userId: targetUserId,
                },
            },
            update: {
                permission: permission as Permission,
            },
            create: {
                dashboardId,
                userId: targetUserId,
                permission: permission as Permission,
            },
            include: {
                user: {
                    select: { id: true, name: true, email: true },
                },
            },
        });

        return share as ShareResult;
    }

    /**
     * Share dashboard by email
     */
    async shareByEmail(
        dashboardId: string,
        email: string,
        permission: 'VIEW' | 'EDIT',
        ownerId: string
    ): Promise<ShareResult> {
        // Find user by email
        const user = await this.prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            throw new Error('User with this email not found');
        }

        return this.share(dashboardId, user.id, permission, ownerId);
    }

    /**
     * Revoke access from a user
     */
    async revoke(dashboardId: string, targetUserId: string, ownerId: string): Promise<void> {
        // Verify dashboard exists and user is owner
        const dashboard = await this.prisma.dashboard.findUnique({
            where: { id: dashboardId },
        });

        if (!dashboard) {
            throw new Error('Dashboard not found');
        }

        if (dashboard.userId !== ownerId) {
            throw new Error('Only dashboard owner can revoke access');
        }

        // Delete share
        await this.prisma.dashboardShare.delete({
            where: {
                dashboardId_userId: {
                    dashboardId,
                    userId: targetUserId,
                },
            },
        }).catch(() => {
            throw new Error('Share not found');
        });
    }

    /**
     * Get all users a dashboard is shared with
     */
    async getSharedWith(dashboardId: string, ownerId: string): Promise<ShareResult[]> {
        // Verify ownership
        const dashboard = await this.prisma.dashboard.findUnique({
            where: { id: dashboardId },
        });

        if (!dashboard) {
            throw new Error('Dashboard not found');
        }

        if (dashboard.userId !== ownerId) {
            throw new Error('Access denied');
        }

        const shares = await this.prisma.dashboardShare.findMany({
            where: { dashboardId },
            include: {
                user: {
                    select: { id: true, name: true, email: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return shares as ShareResult[];
    }

    /**
     * Get all dashboards shared with a user
     */
    async getSharedToMe(userId: string) {
        const shares = await this.prisma.dashboardShare.findMany({
            where: { userId },
            include: {
                dashboard: {
                    include: {
                        user: {
                            select: { id: true, name: true, email: true },
                        },
                        widgets: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return shares.map(share => ({
            ...share.dashboard,
            sharedPermission: share.permission,
            sharedAt: share.createdAt,
            owner: share.dashboard.user,
        }));
    }

    /**
     * Check if user has access to dashboard
     */
    async hasAccess(dashboardId: string, userId: string): Promise<boolean> {
        const share = await this.prisma.dashboardShare.findUnique({
            where: {
                dashboardId_userId: {
                    dashboardId,
                    userId,
                },
            },
        });

        return !!share;
    }

    /**
     * Get user's permission for a dashboard
     */
    async getPermission(dashboardId: string, userId: string): Promise<Permission | null> {
        const share = await this.prisma.dashboardShare.findUnique({
            where: {
                dashboardId_userId: {
                    dashboardId,
                    userId,
                },
            },
        });

        return share?.permission || null;
    }

    /**
     * Check if user can edit dashboard
     */
    async canEdit(dashboardId: string, userId: string): Promise<boolean> {
        // Check if owner
        const dashboard = await this.prisma.dashboard.findUnique({
            where: { id: dashboardId },
        });

        if (dashboard?.userId === userId) {
            return true;
        }

        // Check share permission
        const permission = await this.getPermission(dashboardId, userId);
        return permission === 'EDIT' || permission === 'ADMIN';
    }

    /**
     * Update share permission
     */
    async updatePermission(
        dashboardId: string,
        targetUserId: string,
        permission: 'VIEW' | 'EDIT',
        ownerId: string
    ): Promise<ShareResult> {
        // Verify ownership
        const dashboard = await this.prisma.dashboard.findUnique({
            where: { id: dashboardId },
        });

        if (!dashboard) {
            throw new Error('Dashboard not found');
        }

        if (dashboard.userId !== ownerId) {
            throw new Error('Only dashboard owner can update permissions');
        }

        const share = await this.prisma.dashboardShare.update({
            where: {
                dashboardId_userId: {
                    dashboardId,
                    userId: targetUserId,
                },
            },
            data: {
                permission: permission as Permission,
            },
            include: {
                user: {
                    select: { id: true, name: true, email: true },
                },
            },
        });

        return share as ShareResult;
    }
}

export const shareService = new ShareService();
