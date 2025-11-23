import { PrismaClient, Dashboard, Permission } from '@prisma/client';
import { BaseRepository } from './BaseRepository';

export interface CreateDashboardDto {
  title: string;
  description?: string;
  userId: string;
  isPublic?: boolean;
}

export interface UpdateDashboardDto {
  title?: string;
  description?: string;
  isPublic?: boolean;
}

export interface ShareDashboardDto {
  dashboardId: string;
  userId: string;
  permission: Permission;
}

/**
 * DashboardRepository - Data access layer for Dashboard operations
 * Implements CRUD and sharing operations for Dashboard model
 */
export class DashboardRepository extends BaseRepository {
  constructor(prisma?: PrismaClient) {
    super(prisma);
  }

  /**
   * Create a new dashboard
   */
  async create(data: CreateDashboardDto): Promise<Dashboard> {
    return this.prisma.dashboard.create({
      data: {
        title: data.title,
        description: data.description,
        userId: data.userId,
        isPublic: data.isPublic ?? false,
      },
      include: {
        user: true,
        widgets: true,
      },
    });
  }

  /**
   * Find dashboard by ID
   */
  async findById(id: string, includeRelations = false): Promise<Dashboard | null> {
    return this.prisma.dashboard.findUnique({
      where: { id },
      include: includeRelations
        ? {
            user: true,
            widgets: true,
            layouts: true,
            shares: true,
          }
        : undefined,
    });
  }

  /**
   * Find all dashboards by user ID
   */
  async findByUserId(
    userId: string,
    options?: {
      skip?: number;
      take?: number;
      includeShared?: boolean;
    }
  ): Promise<Dashboard[]> {
    const where = options?.includeShared
      ? {
          OR: [
            { userId },
            { shares: { some: { userId } } },
            { isPublic: true },
          ],
        }
      : { userId };

    return this.prisma.dashboard.findMany({
      where,
      skip: options?.skip,
      take: options?.take,
      orderBy: { updatedAt: 'desc' },
      include: {
        user: true,
        widgets: true,
        shares: true,
      },
    });
  }

  /**
   * Find all public dashboards
   */
  async findPublic(options?: {
    skip?: number;
    take?: number;
  }): Promise<Dashboard[]> {
    return this.prisma.dashboard.findMany({
      where: { isPublic: true },
      skip: options?.skip,
      take: options?.take,
      orderBy: { createdAt: 'desc' },
      include: {
        user: true,
        widgets: true,
      },
    });
  }

  /**
   * Update dashboard by ID
   */
  async update(id: string, data: UpdateDashboardDto): Promise<Dashboard> {
    return this.prisma.dashboard.update({
      where: { id },
      data,
      include: {
        user: true,
        widgets: true,
      },
    });
  }

  /**
   * Delete dashboard by ID
   */
  async delete(id: string): Promise<Dashboard> {
    return this.prisma.dashboard.delete({
      where: { id },
    });
  }

  /**
   * Share dashboard with a user
   */
  async share(data: ShareDashboardDto): Promise<void> {
    await this.prisma.dashboardShare.upsert({
      where: {
        dashboardId_userId: {
          dashboardId: data.dashboardId,
          userId: data.userId,
        },
      },
      create: {
        dashboardId: data.dashboardId,
        userId: data.userId,
        permission: data.permission,
      },
      update: {
        permission: data.permission,
      },
    });
  }

  /**
   * Unshare dashboard from a user
   */
  async unshare(dashboardId: string, userId: string): Promise<void> {
    await this.prisma.dashboardShare.delete({
      where: {
        dashboardId_userId: {
          dashboardId,
          userId,
        },
      },
    });
  }

  /**
   * Get all users who have access to a dashboard
   */
  async getSharedUsers(dashboardId: string) {
    return this.prisma.dashboardShare.findMany({
      where: { dashboardId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
    });
  }

  /**
   * Check if user has access to dashboard
   */
  async hasAccess(dashboardId: string, userId: string): Promise<boolean> {
    const dashboard = await this.prisma.dashboard.findUnique({
      where: { id: dashboardId },
      include: {
        shares: {
          where: { userId },
        },
      },
    });

    if (!dashboard) return false;
    if (dashboard.userId === userId) return true;
    if (dashboard.isPublic) return true;
    if (dashboard.shares.length > 0) return true;

    return false;
  }

  /**
   * Get user's permission level for a dashboard
   */
  async getUserPermission(
    dashboardId: string,
    userId: string
  ): Promise<Permission | null> {
    const dashboard = await this.prisma.dashboard.findUnique({
      where: { id: dashboardId },
      include: {
        shares: {
          where: { userId },
        },
      },
    });

    if (!dashboard) return null;
    if (dashboard.userId === userId) return Permission.ADMIN;
    if (dashboard.shares.length > 0) return dashboard.shares[0].permission;
    if (dashboard.isPublic) return Permission.VIEW;

    return null;
  }

  /**
   * Count dashboards by user
   */
  async countByUser(userId: string): Promise<number> {
    return this.prisma.dashboard.count({
      where: { userId },
    });
  }
}
