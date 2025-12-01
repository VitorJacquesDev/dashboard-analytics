import { PrismaClient, ExportFormat } from '@prisma/client';
import { scheduleWorker } from '../workers/ScheduleWorker';

interface CreateScheduleDto {
    userId: string;
    name: string;
    cronExpr: string;
    dashboardId: string;
    format: ExportFormat[];
    recipients: string[];
}

interface UpdateScheduleDto {
    name?: string;
    cronExpr?: string;
    format?: ExportFormat[];
    recipients?: string[];
    isActive?: boolean;
}

/**
 * ScheduleService - Business logic for scheduled reports
 */
export class ScheduleService {
    private prisma: PrismaClient;

    constructor(prisma?: PrismaClient) {
        this.prisma = prisma || new PrismaClient();
    }

    /**
     * Create a new schedule
     */
    async createSchedule(data: CreateScheduleDto) {
        // Validate CRON expression
        if (!this.isValidCronExpression(data.cronExpr)) {
            throw new Error('Invalid CRON expression');
        }

        // Validate recipients
        if (!data.recipients || data.recipients.length === 0) {
            throw new Error('At least one recipient is required');
        }

        // Validate email format
        for (const email of data.recipients) {
            if (!this.isValidEmail(email)) {
                throw new Error(`Invalid email: ${email}`);
            }
        }

        // Calculate next run time
        const nextRun = this.calculateNextRun(data.cronExpr);

        const schedule = await this.prisma.schedule.create({
            data: {
                userId: data.userId,
                name: data.name,
                cronExpr: data.cronExpr,
                dashboardId: data.dashboardId,
                format: data.format,
                recipients: data.recipients,
                nextRun,
                isActive: true,
            },
            include: {
                user: {
                    select: { id: true, name: true, email: true },
                },
            },
        });

        // Add job to worker if active
        if (schedule.isActive) {
            scheduleWorker.addJob({
                id: schedule.id,
                dashboardId: schedule.dashboardId,
                userId: schedule.userId,
                cronExpression: schedule.cronExpr,
                recipients: schedule.recipients,
                format: schedule.format,
                name: schedule.name,
            });
        }

        return schedule;
    }

    /**
     * Get all schedules for a user
     */
    async getSchedulesByUser(userId: string) {
        return this.prisma.schedule.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * Get schedule by ID
     */
    async getScheduleById(id: string) {
        const schedule = await this.prisma.schedule.findUnique({
            where: { id },
        });

        if (!schedule) {
            throw new Error('Schedule not found');
        }

        return schedule;
    }

    /**
     * Update a schedule
     */
    async updateSchedule(id: string, userId: string, data: UpdateScheduleDto) {
        // Verify ownership
        const existing = await this.prisma.schedule.findUnique({
            where: { id },
        });

        if (!existing) {
            throw new Error('Schedule not found');
        }

        if (existing.userId !== userId) {
            throw new Error('Access denied');
        }

        // Validate CRON if provided
        if (data.cronExpr && !this.isValidCronExpression(data.cronExpr)) {
            throw new Error('Invalid CRON expression');
        }

        // Validate emails if provided
        if (data.recipients) {
            for (const email of data.recipients) {
                if (!this.isValidEmail(email)) {
                    throw new Error(`Invalid email: ${email}`);
                }
            }
        }

        // Calculate new next run if cron changed
        const updateData: any = { ...data };
        if (data.cronExpr) {
            updateData.nextRun = this.calculateNextRun(data.cronExpr);
        }

        const schedule = await this.prisma.schedule.update({
            where: { id },
            data: updateData,
        });

        // Update worker job
        if (data.isActive === false) {
            scheduleWorker.removeJob(id);
        } else if (schedule.isActive) {
            scheduleWorker.addJob({
                id: schedule.id,
                dashboardId: schedule.dashboardId,
                userId: schedule.userId,
                cronExpression: schedule.cronExpr,
                recipients: schedule.recipients,
                format: schedule.format,
                name: schedule.name,
            });
        }

        return schedule;
    }

    /**
     * Delete a schedule
     */
    async deleteSchedule(id: string, userId: string) {
        const existing = await this.prisma.schedule.findUnique({
            where: { id },
        });

        if (!existing) {
            throw new Error('Schedule not found');
        }

        if (existing.userId !== userId) {
            throw new Error('Access denied');
        }

        // Remove from worker
        scheduleWorker.removeJob(id);

        await this.prisma.schedule.delete({
            where: { id },
        });
    }

    /**
     * Toggle schedule active status
     */
    async toggleSchedule(id: string, userId: string) {
        const existing = await this.prisma.schedule.findUnique({
            where: { id },
        });

        if (!existing) {
            throw new Error('Schedule not found');
        }

        if (existing.userId !== userId) {
            throw new Error('Access denied');
        }

        const newStatus = !existing.isActive;

        const schedule = await this.prisma.schedule.update({
            where: { id },
            data: { isActive: newStatus },
        });

        // Update worker
        if (newStatus) {
            scheduleWorker.addJob({
                id: schedule.id,
                dashboardId: schedule.dashboardId,
                userId: schedule.userId,
                cronExpression: schedule.cronExpr,
                recipients: schedule.recipients,
                format: schedule.format,
                name: schedule.name,
            });
        } else {
            scheduleWorker.removeJob(id);
        }

        return schedule;
    }

    /**
     * Validate CRON expression
     */
    private isValidCronExpression(expr: string): boolean {
        // Basic validation - 5 or 6 parts
        const parts = expr.trim().split(/\s+/);
        return parts.length >= 5 && parts.length <= 6;
    }

    /**
     * Validate email format
     */
    private isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Calculate next run time from CRON expression
     */
    private calculateNextRun(cronExpr: string): Date {
        // Simplified - in production use a proper CRON parser
        // For now, return next hour
        const next = new Date();
        next.setHours(next.getHours() + 1);
        next.setMinutes(0);
        next.setSeconds(0);
        next.setMilliseconds(0);
        return next;
    }

    /**
     * Get human-readable schedule description
     */
    getCronDescription(cronExpr: string): string {
        const parts = cronExpr.split(' ');
        if (parts.length < 5) return cronExpr;

        const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

        if (dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
            return `Daily at ${hour}:${minute.padStart(2, '0')}`;
        }
        if (dayOfMonth === '*' && month === '*' && dayOfWeek !== '*') {
            return `Weekly on day ${dayOfWeek} at ${hour}:${minute.padStart(2, '0')}`;
        }
        if (dayOfMonth !== '*' && month === '*') {
            return `Monthly on day ${dayOfMonth} at ${hour}:${minute.padStart(2, '0')}`;
        }

        return cronExpr;
    }
}

export const scheduleService = new ScheduleService();
