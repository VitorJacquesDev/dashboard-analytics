import cron, { ScheduledTask } from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { ReportGenerator } from './ReportGenerator';

interface ScheduleJob {
    id: string;
    dashboardId: string;
    userId: string;
    cronExpression: string;
    recipients: string[];
    format: string[];
    name: string;
}

/**
 * ScheduleWorker - Manages CRON jobs for scheduled reports
 */
export class ScheduleWorker {
    private jobs: Map<string, ScheduledTask> = new Map();
    private prisma: PrismaClient;
    private reportGenerator: ReportGenerator;
    private isRunning: boolean = false;

    constructor(prisma?: PrismaClient) {
        this.prisma = prisma || new PrismaClient();
        this.reportGenerator = new ReportGenerator(this.prisma);
    }

    /**
     * Start the worker and load all active schedules
     */
    async start(): Promise<void> {
        if (this.isRunning) {
            console.log('[ScheduleWorker] Already running');
            return;
        }

        console.log('[ScheduleWorker] Starting...');
        this.isRunning = true;

        try {
            // Load all active schedules from database
            const schedules = await this.prisma.schedule.findMany({
                where: { isActive: true },
                include: {
                    dashboard: true,
                    user: true,
                },
            });

            console.log(`[ScheduleWorker] Found ${schedules.length} active schedules`);

            for (const schedule of schedules) {
                this.addJob({
                    id: schedule.id,
                    dashboardId: schedule.dashboardId,
                    userId: schedule.userId,
                    cronExpression: schedule.cronExpr,
                    recipients: schedule.recipients,
                    format: schedule.format,
                    name: schedule.name,
                });
            }

            console.log('[ScheduleWorker] Started successfully');
        } catch (error) {
            console.error('[ScheduleWorker] Failed to start:', error);
            this.isRunning = false;
            throw error;
        }
    }

    /**
     * Stop all jobs and shutdown worker
     */
    stop(): void {
        console.log('[ScheduleWorker] Stopping...');
        
        for (const [id, task] of this.jobs) {
            task.stop();
            console.log(`[ScheduleWorker] Stopped job: ${id}`);
        }
        
        this.jobs.clear();
        this.isRunning = false;
        console.log('[ScheduleWorker] Stopped');
    }

    /**
     * Add a new scheduled job
     */
    addJob(schedule: ScheduleJob): void {
        // Validate CRON expression
        if (!cron.validate(schedule.cronExpression)) {
            console.error(`[ScheduleWorker] Invalid CRON expression: ${schedule.cronExpression}`);
            return;
        }

        // Remove existing job if any
        if (this.jobs.has(schedule.id)) {
            this.removeJob(schedule.id);
        }

        const task = cron.schedule(schedule.cronExpression, async () => {
            await this.executeJob(schedule);
        });

        this.jobs.set(schedule.id, task);
        console.log(`[ScheduleWorker] Added job: ${schedule.id} with cron: ${schedule.cronExpression}`);
    }

    /**
     * Remove a scheduled job
     */
    removeJob(scheduleId: string): void {
        const task = this.jobs.get(scheduleId);
        if (task) {
            task.stop();
            this.jobs.delete(scheduleId);
            console.log(`[ScheduleWorker] Removed job: ${scheduleId}`);
        }
    }

    /**
     * Execute a scheduled job
     */
    async executeJob(schedule: ScheduleJob): Promise<void> {
        const startTime = Date.now();
        console.log(`[ScheduleWorker] Executing job: ${schedule.id}`);

        try {
            // Generate report
            const reportBuffer = await this.reportGenerator.generatePDF(schedule.dashboardId);

            // Send to all recipients
            for (const recipient of schedule.recipients) {
                await this.reportGenerator.sendEmail(
                    recipient,
                    `Dashboard Report: ${schedule.name}`,
                    reportBuffer,
                    `report-${schedule.dashboardId}.pdf`
                );
            }

            // Log success
            await this.logExecution(schedule.id, 'SUCCESS', null, Date.now() - startTime);
            
            // Update lastRun
            await this.prisma.schedule.update({
                where: { id: schedule.id },
                data: { lastRun: new Date() },
            });

            console.log(`[ScheduleWorker] Job ${schedule.id} completed successfully`);
        } catch (error: any) {
            console.error(`[ScheduleWorker] Job ${schedule.id} failed:`, error);
            
            // Log failure
            await this.logExecution(schedule.id, 'FAILED', error.message, Date.now() - startTime);
        }
    }

    /**
     * Log job execution
     */
    private async logExecution(
        scheduleId: string,
        status: 'SUCCESS' | 'FAILED',
        errorMessage: string | null,
        durationMs: number
    ): Promise<void> {
        try {
            // Store in a simple log - in production, you might want a separate table
            console.log(`[ScheduleWorker] Execution log: ${scheduleId} - ${status} - ${durationMs}ms`);
            if (errorMessage) {
                console.log(`[ScheduleWorker] Error: ${errorMessage}`);
            }
        } catch (error) {
            console.error('[ScheduleWorker] Failed to log execution:', error);
        }
    }

    /**
     * Get status of all jobs
     */
    getStatus(): { id: string; isRunning: boolean }[] {
        return Array.from(this.jobs.entries()).map(([id]) => ({
            id,
            isRunning: true,
        }));
    }

    /**
     * Check if worker is running
     */
    isWorkerRunning(): boolean {
        return this.isRunning;
    }

    /**
     * Pause a specific job
     */
    pauseJob(scheduleId: string): boolean {
        const task = this.jobs.get(scheduleId);
        if (task) {
            task.stop();
            return true;
        }
        return false;
    }

    /**
     * Resume a specific job
     */
    resumeJob(scheduleId: string): boolean {
        const task = this.jobs.get(scheduleId);
        if (task) {
            task.start();
            return true;
        }
        return false;
    }
}

// Singleton instance
export const scheduleWorker = new ScheduleWorker();
