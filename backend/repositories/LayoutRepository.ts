import { PrismaClient, Layout, Theme } from '@prisma/client';
import { BaseRepository } from './BaseRepository';

export interface CreateLayoutDto {
  userId: string;
  dashboardId: string;
  layout: any;
  theme?: Theme;
}

export interface UpdateLayoutDto {
  layout?: any;
  theme?: Theme;
}

/**
 * LayoutRepository - Data access layer for Layout operations
 * Implements save and load operations for Layout model
 */
export class LayoutRepository extends BaseRepository {
  constructor(prisma?: PrismaClient) {
    super(prisma);
  }

  /**
   * Save layout (create or update)
   */
  async save(data: CreateLayoutDto): Promise<Layout> {
    return this.prisma.layout.upsert({
      where: {
        userId_dashboardId: {
          userId: data.userId,
          dashboardId: data.dashboardId,
        },
      },
      create: {
        userId: data.userId,
        dashboardId: data.dashboardId,
        layout: data.layout,
        theme: data.theme ?? Theme.LIGHT,
      },
      update: {
        layout: data.layout,
        theme: data.theme,
      },
      include: {
        user: true,
        dashboard: true,
      },
    });
  }

  /**
   * Load layout by user and dashboard
   */
  async load(userId: string, dashboardId: string): Promise<Layout | null> {
    return this.prisma.layout.findUnique({
      where: {
        userId_dashboardId: {
          userId,
          dashboardId,
        },
      },
      include: {
        user: true,
        dashboard: true,
      },
    });
  }

  /**
   * Find layout by ID
   */
  async findById(id: string): Promise<Layout | null> {
    return this.prisma.layout.findUnique({
      where: { id },
      include: {
        user: true,
        dashboard: true,
      },
    });
  }

  /**
   * Find all layouts by user ID
   */
  async findByUserId(userId: string): Promise<Layout[]> {
    return this.prisma.layout.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        dashboard: true,
      },
    });
  }

  /**
   * Find all layouts by dashboard ID
   */
  async findByDashboardId(dashboardId: string): Promise<Layout[]> {
    return this.prisma.layout.findMany({
      where: { dashboardId },
      orderBy: { updatedAt: 'desc' },
      include: {
        user: true,
      },
    });
  }

  /**
   * Update layout
   */
  async update(
    userId: string,
    dashboardId: string,
    data: UpdateLayoutDto
  ): Promise<Layout> {
    return this.prisma.layout.update({
      where: {
        userId_dashboardId: {
          userId,
          dashboardId,
        },
      },
      data,
      include: {
        user: true,
        dashboard: true,
      },
    });
  }

  /**
   * Delete layout
   */
  async delete(userId: string, dashboardId: string): Promise<Layout> {
    return this.prisma.layout.delete({
      where: {
        userId_dashboardId: {
          userId,
          dashboardId,
        },
      },
    });
  }

  /**
   * Delete all layouts for a user
   */
  async deleteByUserId(userId: string): Promise<number> {
    const result = await this.prisma.layout.deleteMany({
      where: { userId },
    });
    return result.count;
  }

  /**
   * Delete all layouts for a dashboard
   */
  async deleteByDashboardId(dashboardId: string): Promise<number> {
    const result = await this.prisma.layout.deleteMany({
      where: { dashboardId },
    });
    return result.count;
  }

  /**
   * Check if layout exists
   */
  async exists(userId: string, dashboardId: string): Promise<boolean> {
    const count = await this.prisma.layout.count({
      where: {
        userId,
        dashboardId,
      },
    });
    return count > 0;
  }

  /**
   * Update theme preference
   */
  async updateTheme(
    userId: string,
    dashboardId: string,
    theme: Theme
  ): Promise<Layout> {
    return this.prisma.layout.update({
      where: {
        userId_dashboardId: {
          userId,
          dashboardId,
        },
      },
      data: { theme },
    });
  }

  /**
   * Get user's theme preference for a dashboard
   */
  async getTheme(userId: string, dashboardId: string): Promise<Theme | null> {
    const layout = await this.prisma.layout.findUnique({
      where: {
        userId_dashboardId: {
          userId,
          dashboardId,
        },
      },
      select: {
        theme: true,
      },
    });
    return layout?.theme ?? null;
  }
}
