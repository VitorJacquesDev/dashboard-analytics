import { PrismaClient, Widget, WidgetType } from '@prisma/client';
import { BaseRepository } from './BaseRepository';

export interface CreateWidgetDto {
  dashboardId: string;
  type: WidgetType;
  title: string;
  config: any;
  dataSource: string;
}

export interface UpdateWidgetDto {
  type?: WidgetType;
  title?: string;
  config?: any;
  dataSource?: string;
}

/**
 * WidgetRepository - Data access layer for Widget operations
 * Implements CRUD operations for Widget model
 */
export class WidgetRepository extends BaseRepository {
  constructor(prisma?: PrismaClient) {
    super(prisma);
  }

  /**
   * Create a new widget
   */
  async create(data: CreateWidgetDto): Promise<Widget> {
    return this.prisma.widget.create({
      data: {
        dashboardId: data.dashboardId,
        type: data.type,
        title: data.title,
        config: data.config,
        dataSource: data.dataSource,
      },
      include: {
        dashboard: true,
      },
    });
  }

  /**
   * Find widget by ID
   */
  async findById(id: string): Promise<Widget | null> {
    return this.prisma.widget.findUnique({
      where: { id },
      include: {
        dashboard: true,
      },
    });
  }

  /**
   * Find all widgets by dashboard ID
   */
  async findByDashboardId(dashboardId: string): Promise<Widget[]> {
    return this.prisma.widget.findMany({
      where: { dashboardId },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Find widgets by type
   */
  async findByType(
    type: WidgetType,
    options?: {
      skip?: number;
      take?: number;
    }
  ): Promise<Widget[]> {
    return this.prisma.widget.findMany({
      where: { type },
      skip: options?.skip,
      take: options?.take,
      orderBy: { createdAt: 'desc' },
      include: {
        dashboard: true,
      },
    });
  }

  /**
   * Update widget by ID
   */
  async update(id: string, data: UpdateWidgetDto): Promise<Widget> {
    return this.prisma.widget.update({
      where: { id },
      data,
      include: {
        dashboard: true,
      },
    });
  }

  /**
   * Delete widget by ID
   */
  async delete(id: string): Promise<Widget> {
    return this.prisma.widget.delete({
      where: { id },
    });
  }

  /**
   * Delete all widgets from a dashboard
   */
  async deleteByDashboardId(dashboardId: string): Promise<number> {
    const result = await this.prisma.widget.deleteMany({
      where: { dashboardId },
    });
    return result.count;
  }

  /**
   * Count widgets in a dashboard
   */
  async countByDashboard(dashboardId: string): Promise<number> {
    return this.prisma.widget.count({
      where: { dashboardId },
    });
  }

  /**
   * Bulk create widgets
   */
  async createMany(widgets: CreateWidgetDto[]): Promise<number> {
    const result = await this.prisma.widget.createMany({
      data: widgets,
    });
    return result.count;
  }

  /**
   * Check if widget exists
   */
  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.widget.count({
      where: { id },
    });
    return count > 0;
  }
}
