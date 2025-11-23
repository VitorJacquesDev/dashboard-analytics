import { PrismaClient, Schedule, ExportFormat } from '@prisma/client';
import { BaseRepository } from './BaseRepository';

export interface CreateScheduleDto {
  userId: string;
  name: string;
  cronExpr: string;
  dashboardId: string;
  format: ExportFormat[];
  recipients: string[];
  isActive?: boolean;
  nextRun: Date;
}

export interface UpdateScheduleDto {
  name?: string;
  cronExpr?: string;
  dashboardId?: string;
  format?: ExportFormat[];
  recipients?: string[];
  isActive?: boolean;
  lastRun?: Date;
  nextRun?: Date;
}

/**
 * ScheduleRepository - Data access layer for Schedule operations
 * Implements CRUD operations for Schedule model
 */
export class ScheduleRepository extends BaseRepository {
  constructor(prisma?: PrismaClient) {
    super(prisma);
  }

  /**
   * Create a new schedule
   */
  async create(data: CreateScheduleDto): Promise<Schedule> {
    return this.prisma.schedule.create({
      data: {
        userId: data.userId,
        name: data.name,
        cronExpr: data.cronExpr,
        dashboardId: data.dashboardId,
        format: data.format,
        recipients: data.recipients,
        isActive: data.isActive ?? true,
        nextRun: data.nextRun,
      },
      include: {
        user: true,
      },
    });
  }

  /**
   * Find schedule by ID
   */
  async findById(id: string): Promise<Schedule | null> {
    return this.prisma.schedule.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });
  }

  /**
   * Find all schedules by user ID
   */
  async findByUserId(
    userId: string,
    options?: {
      skip?: number;
      take?: number;
      activeOnly?: boolean;
    }
  ): Promise<Schedule[]> {
    return this.prisma.schedule.findMany({
      where: {
        userId,
        ...(options?.activeOnly ? { isActive: true } : {}),
      },
      skip: options?.skip,
      take: options?.take,
      orderBy: { createdAt: 'desc' },
      include: {
        user: true,
      },
    });
  }

  /**
   * Find all active schedules
   */
  async findActive(options?: {
    skip?: number;
    take?: number;
  }): Promise<Schedule[]> {
    return this.prisma.schedule.findMany({
      where: { isActive: true },
      skip: options?.skip,
      take: options?.take,
      orderBy: { nextRun: 'asc' },
      include: {
        user: true,
      },
    });
  }

  /**
   * Find schedules due for execution
   */
  async findDue(beforeDate: Date): Promise<Schedule[]> {
    return this.prisma.schedule.findMany({
      where: {
        isActive: true,
        nextRun: {
          lte: beforeDate,
        },
      },
      orderBy: { nextRun: 'asc' },
      include: {
        user: true,
      },
    });
  }

  /**
   * Find schedules by dashboard ID
   */
  async findByDashboardId(dashboardId: string): Promise<Schedule[]> {
    return this.prisma.schedule.findMany({
      where: { dashboardId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: true,
      },
    });
  }

  /**
   * Update schedule by ID
   */
  async update(id: string, data: UpdateScheduleDto): Promise<Schedule> {
    return this.prisma.schedule.update({
      where: { id },
      data,
      include: {
        user: true,
      },
    });
  }

  /**
   * Update last run time
   */
  async updateLastRun(id: string, lastRun: Date): Promise<Schedule> {
    return this.prisma.schedule.update({
      where: { id },
      data: { lastRun },
    });
  }

  /**
   * Update next run time
   */
  async updateNextRun(id: string, nextRun: Date): Promise<Schedule> {
    return this.prisma.schedule.update({
      where: { id },
      data: { nextRun },
    });
  }

  /**
   * Activate schedule
   */
  async activate(id: string): Promise<Schedule> {
    return this.prisma.schedule.update({
      where: { id },
      data: { isActive: true },
    });
  }

  /**
   * Deactivate schedule
   */
  async deactivate(id: string): Promise<Schedule> {
    return this.prisma.schedule.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * Delete schedule by ID
   */
  async delete(id: string): Promise<Schedule> {
    return this.prisma.schedule.delete({
      where: { id },
    });
  }

  /**
   * Delete all schedules for a user
   */
  async deleteByUserId(userId: string): Promise<number> {
    const result = await this.prisma.schedule.deleteMany({
      where: { userId },
    });
    return result.count;
  }

  /**
   * Delete all schedules for a dashboard
   */
  async deleteByDashboardId(dashboardId: string): Promise<number> {
    const result = await this.prisma.schedule.deleteMany({
      where: { dashboardId },
    });
    return result.count;
  }

  /**
   * Count schedules by user
   */
  async countByUser(userId: string, activeOnly = false): Promise<number> {
    return this.prisma.schedule.count({
      where: {
        userId,
        ...(activeOnly ? { isActive: true } : {}),
      },
    });
  }

  /**
   * Count all active schedules
   */
  async countActive(): Promise<number> {
    return this.prisma.schedule.count({
      where: { isActive: true },
    });
  }

  /**
   * Check if schedule exists
   */
  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.schedule.count({
      where: { id },
    });
    return count > 0;
  }
}
