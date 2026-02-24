import { WidgetType } from '@prisma/client';
import type { Widget } from '@/lib/types';
import type { WidgetDataProvider, WidgetDataProviderContext } from '../types';

type JsonRecord = Record<string, unknown>;

const PRISMA_DASHBOARD_PREFIX = 'prisma:dashboard.';

export class PrismaDashboardWidgetDataProvider implements WidgetDataProvider {
  readonly name = 'prisma-dashboard';

  canHandle(widget: Widget): boolean {
    return widget.dataSource.startsWith(PRISMA_DASHBOARD_PREFIX);
  }

  async getData({ prisma, widget }: WidgetDataProviderContext): Promise<any[]> {
    switch (widget.dataSource) {
      case 'prisma:dashboard.widgets.count':
        return this.getDashboardWidgetsCount(prisma, widget);
      case 'prisma:dashboard.widgets.by_type':
        return this.getDashboardWidgetsByType(prisma, widget);
      case 'prisma:dashboard.widgets.timeline':
        return this.getDashboardWidgetsTimeline(prisma, widget);
      case 'prisma:dashboard.schedules.active_count':
        return this.getDashboardActiveSchedulesCount(prisma, widget);
      case 'prisma:dashboard.schedules.upcoming':
        return this.getDashboardUpcomingSchedules(prisma, widget);
      default:
        throw new Error(`Unsupported widget data source: ${widget.dataSource}`);
    }
  }

  private async getDashboardWidgetsCount(prisma: WidgetDataProviderContext['prisma'], widget: Widget) {
    const total = await prisma.widget.count({
      where: { dashboardId: widget.dashboardId },
    });

    return [
      {
        x: 'Widgets',
        y: total,
      },
    ];
  }

  private async getDashboardWidgetsByType(prisma: WidgetDataProviderContext['prisma'], widget: Widget) {
    const grouped = await prisma.widget.groupBy({
      by: ['type'],
      where: { dashboardId: widget.dashboardId },
      _count: {
        _all: true,
      },
      orderBy: {
        type: 'asc',
      },
    });

    if (widget.type === WidgetType.TABLE) {
      return grouped.map((row) => ({
        type: row.type,
        count: row._count._all,
      }));
    }

    return grouped.map((row) => ({
      x: row.type,
      y: row._count._all,
    }));
  }

  private async getDashboardWidgetsTimeline(prisma: WidgetDataProviderContext['prisma'], widget: Widget) {
    const config = this.getConfigObject(widget.config);
    const days = this.getIntegerConfig(config, 'days', 14, 1, 365);
    const startDate = this.getStartDate(days);
    const widgetRows = await prisma.widget.findMany({
      where: {
        dashboardId: widget.dashboardId,
        createdAt: { gte: startDate },
      },
      select: {
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const countsByDay = new Map<string, number>();

    for (let offset = 0; offset < days; offset += 1) {
      const day = new Date(startDate);
      day.setUTCDate(startDate.getUTCDate() + offset);
      countsByDay.set(day.toISOString().slice(0, 10), 0);
    }

    for (const row of widgetRows) {
      const key = row.createdAt.toISOString().slice(0, 10);
      countsByDay.set(key, (countsByDay.get(key) ?? 0) + 1);
    }

    const points = Array.from(countsByDay.entries()).map(([date, count]) => ({
      date,
      count,
    }));

    if (widget.type === WidgetType.TABLE) {
      return points;
    }

    return points.map((point) => ({
      x: point.date,
      y: point.count,
    }));
  }

  private async getDashboardActiveSchedulesCount(prisma: WidgetDataProviderContext['prisma'], widget: Widget) {
    const total = await prisma.schedule.count({
      where: {
        dashboardId: widget.dashboardId,
        isActive: true,
      },
    });

    return [
      {
        x: 'Active Schedules',
        y: total,
      },
    ];
  }

  private async getDashboardUpcomingSchedules(prisma: WidgetDataProviderContext['prisma'], widget: Widget) {
    if (widget.type !== WidgetType.TABLE) {
      throw new Error('Unsupported widget type for data source prisma:dashboard.schedules.upcoming');
    }

    const config = this.getConfigObject(widget.config);
    const limit = this.getIntegerConfig(config, 'limit', 10, 1, 100);
    const includeInactive = this.getBooleanConfig(config, 'includeInactive', false);

    const schedules = await prisma.schedule.findMany({
      where: {
        dashboardId: widget.dashboardId,
        ...(includeInactive ? {} : { isActive: true }),
      },
      orderBy: {
        nextRun: 'asc',
      },
      take: limit,
      select: {
        name: true,
        cronExpr: true,
        isActive: true,
        nextRun: true,
        lastRun: true,
        recipients: true,
      },
    });

    return schedules.map((schedule) => ({
      name: schedule.name,
      cronExpr: schedule.cronExpr,
      isActive: schedule.isActive ? 'Yes' : 'No',
      nextRun: schedule.nextRun.toISOString(),
      lastRun: schedule.lastRun ? schedule.lastRun.toISOString() : '',
      recipients: schedule.recipients.length,
    }));
  }

  private getConfigObject(config: unknown): JsonRecord {
    if (!config || typeof config !== 'object' || Array.isArray(config)) {
      return {};
    }

    return config as JsonRecord;
  }

  private getIntegerConfig(
    config: JsonRecord,
    key: string,
    fallback: number,
    min: number,
    max: number
  ): number {
    const raw = config[key];
    if (raw === undefined || raw === null) {
      return fallback;
    }

    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed < min || parsed > max) {
      throw new Error(`Invalid widget config: ${key} must be an integer between ${min} and ${max}`);
    }

    return parsed;
  }

  private getBooleanConfig(config: JsonRecord, key: string, fallback: boolean): boolean {
    const raw = config[key];
    if (raw === undefined || raw === null) {
      return fallback;
    }

    if (typeof raw !== 'boolean') {
      throw new Error(`Invalid widget config: ${key} must be a boolean`);
    }

    return raw;
  }

  private getStartDate(days: number): Date {
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    start.setUTCDate(start.getUTCDate() - (days - 1));
    return start;
  }
}

