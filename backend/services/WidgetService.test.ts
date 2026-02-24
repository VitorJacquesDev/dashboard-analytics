import { WidgetType } from '@prisma/client';
import { WidgetService } from './WidgetService';

describe('WidgetService widget data cache', () => {
  const baseWidget = {
    id: 'widget-1',
    dashboardId: 'dashboard-1',
    type: WidgetType.METRIC,
    title: 'Revenue',
    config: { metric: 'revenue' },
    dataSource: 'mock:seeded',
    createdAt: new Date('2026-02-01T00:00:00.000Z'),
    updatedAt: new Date('2026-02-01T00:00:00.000Z'),
  } as any;

  let mockPrisma: any;
  let service: WidgetService;

  beforeEach(() => {
    WidgetService.clearWidgetDataCacheForTests();
    process.env.WIDGET_DATA_CACHE_TTL_MS = '60000';

    mockPrisma = {
      widget: {
        create: jest.fn().mockImplementation(async ({ data }: any) => ({
          ...baseWidget,
          ...data,
          id: 'created-widget',
        })),
        findUnique: jest.fn().mockResolvedValue(baseWidget),
        count: jest.fn().mockResolvedValue(1),
        groupBy: jest.fn().mockResolvedValue([]),
        findMany: jest.fn().mockResolvedValue([]),
        update: jest.fn().mockImplementation(async ({ data }: any) => ({
          ...baseWidget,
          ...data,
          updatedAt: new Date('2026-02-01T00:01:00.000Z'),
        })),
        delete: jest.fn().mockResolvedValue(baseWidget),
      },
      schedule: {
        count: jest.fn().mockResolvedValue(0),
        findMany: jest.fn().mockResolvedValue([]),
      },
      dashboard: {
        findUnique: jest.fn().mockResolvedValue({ id: baseWidget.dashboardId }),
      },
    };

    service = new WidgetService(mockPrisma);
  });

  afterEach(() => {
    WidgetService.clearWidgetDataCacheForTests();
    delete process.env.WIDGET_DATA_CACHE_TTL_MS;
    jest.restoreAllMocks();
  });

  it('reuses cached data for the same widget and filters', async () => {
    const randomSpy = jest.spyOn(Math, 'random')
      .mockReturnValueOnce(0.1)
      .mockReturnValueOnce(0.9);
    const filters = [{ field: 'region', operator: 'eq', value: 'BR' }] as any;

    const firstResult = await service.getWidgetData(baseWidget.id, filters);
    const secondResult = await service.getWidgetData(baseWidget.id, filters);

    expect(firstResult).toEqual(secondResult);
    expect(randomSpy).toHaveBeenCalledTimes(1);
  });

  it('uses distinct cache entries for different filters', async () => {
    const randomSpy = jest.spyOn(Math, 'random')
      .mockReturnValueOnce(0.1)
      .mockReturnValueOnce(0.9);

    const filtersA = [{ field: 'region', operator: 'eq', value: 'BR' }] as any;
    const filtersB = [{ field: 'region', operator: 'eq', value: 'US' }] as any;

    const resultA = await service.getWidgetData(baseWidget.id, filtersA);
    const resultB = await service.getWidgetData(baseWidget.id, filtersB);

    expect(resultA).not.toEqual(resultB);
    expect(randomSpy).toHaveBeenCalledTimes(2);
  });

  it('invalidates cache when the widget is updated', async () => {
    const randomSpy = jest.spyOn(Math, 'random')
      .mockReturnValueOnce(0.1)
      .mockReturnValueOnce(0.9);

    const firstResult = await service.getWidgetData(baseWidget.id);
    await service.updateWidget(baseWidget.id, { title: 'Updated revenue' });
    const secondResult = await service.getWidgetData(baseWidget.id);

    expect(firstResult).not.toEqual(secondResult);
    expect(randomSpy).toHaveBeenCalledTimes(2);
  });

  it('invalidates cache when the widget is deleted', async () => {
    const randomSpy = jest.spyOn(Math, 'random')
      .mockReturnValueOnce(0.1)
      .mockReturnValueOnce(0.9);

    const firstResult = await service.getWidgetData(baseWidget.id);
    await service.deleteWidget(baseWidget.id);
    const secondResult = await service.getWidgetData(baseWidget.id);

    expect(firstResult).not.toEqual(secondResult);
    expect(randomSpy).toHaveBeenCalledTimes(2);
  });

  it('uses Prisma provider for dashboard widget count metric', async () => {
    mockPrisma.widget.findUnique.mockResolvedValueOnce({
      ...baseWidget,
      dataSource: 'prisma:dashboard.widgets.count',
      type: WidgetType.METRIC,
    });
    mockPrisma.widget.count.mockResolvedValueOnce(7);

    const result = await service.getWidgetData(baseWidget.id);

    expect(mockPrisma.widget.count).toHaveBeenCalledWith({
      where: { dashboardId: baseWidget.dashboardId },
    });
    expect(result).toEqual([{ x: 'Widgets', y: 7 }]);
  });

  it('applies widget filters to Prisma queries for dashboard widget metrics', async () => {
    mockPrisma.widget.findUnique.mockResolvedValueOnce({
      ...baseWidget,
      dataSource: 'prisma:dashboard.widgets.count',
      type: WidgetType.METRIC,
    });
    mockPrisma.widget.count.mockResolvedValueOnce(3);

    await service.getWidgetData(baseWidget.id, [
      { field: 'category', operator: 'eq', value: 'bar-chart' } as any,
      { field: 'title', operator: 'contains', value: 'sales' } as any,
    ]);

    expect(mockPrisma.widget.count).toHaveBeenCalledWith({
      where: {
        dashboardId: baseWidget.dashboardId,
        AND: [
          { type: WidgetType.BAR_CHART },
          { title: { contains: 'sales', mode: 'insensitive' } },
        ],
      },
    });
  });

  it('uses Prisma provider for widgets grouped by type', async () => {
    mockPrisma.widget.findUnique.mockResolvedValueOnce({
      ...baseWidget,
      dataSource: 'prisma:dashboard.widgets.by_type',
      type: WidgetType.BAR_CHART,
    });
    mockPrisma.widget.groupBy.mockResolvedValueOnce([
      { type: WidgetType.BAR_CHART, _count: { _all: 2 } },
      { type: WidgetType.PIE_CHART, _count: { _all: 1 } },
    ]);

    const result = await service.getWidgetData(baseWidget.id);

    expect(mockPrisma.widget.groupBy).toHaveBeenCalledWith({
      by: ['type'],
      where: { dashboardId: baseWidget.dashboardId },
      _count: { _all: true },
      orderBy: { type: 'asc' },
    });
    expect(result).toEqual([
      { x: WidgetType.BAR_CHART, y: 2 },
      { x: WidgetType.PIE_CHART, y: 1 },
    ]);
  });

  it('applies schedule filters to Prisma queries for upcoming schedules', async () => {
    mockPrisma.widget.findUnique.mockResolvedValueOnce({
      ...baseWidget,
      dataSource: 'prisma:dashboard.schedules.upcoming',
      type: WidgetType.TABLE,
      config: { limit: 5, includeInactive: true },
    });
    mockPrisma.schedule.findMany.mockResolvedValueOnce([]);

    await service.getWidgetData(baseWidget.id, [
      { field: 'status', operator: 'eq', value: 'inactive' } as any,
      { field: 'date', operator: 'gte', value: '2026-02-10T00:00:00.000Z' } as any,
    ]);

    expect(mockPrisma.schedule.findMany).toHaveBeenCalledWith({
      where: {
        dashboardId: baseWidget.dashboardId,
        AND: [
          { isActive: false },
          { nextRun: { gte: new Date('2026-02-10T00:00:00.000Z') } },
        ],
      },
      orderBy: {
        nextRun: 'asc',
      },
      take: 5,
      select: {
        name: true,
        cronExpr: true,
        isActive: true,
        nextRun: true,
        lastRun: true,
        recipients: true,
      },
    });
  });

  it('rejects Prisma provider output that violates the widget data contract', async () => {
    mockPrisma.widget.findUnique.mockResolvedValueOnce({
      ...baseWidget,
      dataSource: 'prisma:dashboard.widgets.count',
      type: WidgetType.METRIC,
    });
    mockPrisma.widget.count.mockResolvedValueOnce('7');

    await expect(service.getWidgetData(baseWidget.id)).rejects.toThrow('Invalid widget data contract');
  });

  it('rejects invalid config for prisma timeline data source on create', async () => {
    await expect(
      service.createWidget({
        dashboardId: baseWidget.dashboardId,
        type: WidgetType.LINE_CHART,
        title: 'Timeline',
        dataSource: 'prisma:dashboard.widgets.timeline',
        config: { days: 500 },
      })
    ).rejects.toThrow('Invalid widget config');
  });

  it('rejects non-table type for upcoming schedules data source on create', async () => {
    await expect(
      service.createWidget({
        dashboardId: baseWidget.dashboardId,
        type: WidgetType.METRIC,
        title: 'Upcoming schedules',
        dataSource: 'prisma:dashboard.schedules.upcoming',
        config: {},
      })
    ).rejects.toThrow('Invalid widget config');
  });
});
