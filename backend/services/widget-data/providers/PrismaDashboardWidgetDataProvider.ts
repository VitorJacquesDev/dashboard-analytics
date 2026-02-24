import { Prisma, WidgetType } from '@prisma/client';
import type { Filter, Widget } from '@/lib/types';
import type { WidgetDataProvider, WidgetDataProviderContext } from '../types';
import { validatePrismaDashboardWidgetOutput } from '../prisma-dashboard-contracts';

type JsonRecord = Record<string, unknown>;

const PRISMA_DATA_SOURCE_PREFIX = 'prisma:';
const OPEN_OPERATIONS_TICKET_STATUSES = ['OPEN', 'IN_PROGRESS', 'BLOCKED'] as const;

export class PrismaDashboardWidgetDataProvider implements WidgetDataProvider {
  readonly name = 'prisma';

  canHandle(widget: Widget): boolean {
    return widget.dataSource.startsWith(PRISMA_DATA_SOURCE_PREFIX);
  }

  async getData({ prisma, widget, filters }: WidgetDataProviderContext): Promise<any[]> {
    const data = await (async () => {
      switch (widget.dataSource) {
        case 'prisma:dashboard.widgets.count':
          return this.getDashboardWidgetsCount(prisma, widget, filters);
        case 'prisma:dashboard.widgets.by_type':
          return this.getDashboardWidgetsByType(prisma, widget, filters);
        case 'prisma:dashboard.widgets.timeline':
          return this.getDashboardWidgetsTimeline(prisma, widget, filters);
        case 'prisma:dashboard.schedules.active_count':
          return this.getDashboardActiveSchedulesCount(prisma, widget, filters);
        case 'prisma:dashboard.schedules.upcoming':
          return this.getDashboardUpcomingSchedules(prisma, widget, filters);
        case 'prisma:business.sales.revenue.total':
          return this.getBusinessSalesRevenueTotal(prisma, widget);
        case 'prisma:business.sales.revenue.timeline':
          return this.getBusinessSalesRevenueTimeline(prisma, widget);
        case 'prisma:business.sales.orders.by_status':
          return this.getBusinessSalesOrdersGrouped(prisma, widget, 'status');
        case 'prisma:business.sales.orders.by_region':
          return this.getBusinessSalesOrdersGrouped(prisma, widget, 'region');
        case 'prisma:business.sales.orders.by_channel':
          return this.getBusinessSalesOrdersGrouped(prisma, widget, 'channel');
        case 'prisma:business.marketing.leads.conversion_rate':
          return this.getBusinessMarketingLeadsConversionRate(prisma, widget);
        case 'prisma:business.marketing.leads.timeline':
          return this.getBusinessMarketingLeadsTimeline(prisma, widget);
        case 'prisma:business.marketing.leads.by_channel':
          return this.getBusinessMarketingLeadsGrouped(prisma, widget, 'channel');
        case 'prisma:business.marketing.leads.by_stage':
          return this.getBusinessMarketingLeadsGrouped(prisma, widget, 'stage');
        case 'prisma:business.operations.tickets.open_count':
          return this.getBusinessOperationsTicketsOpenCount(prisma, widget);
        case 'prisma:business.operations.tickets.timeline':
          return this.getBusinessOperationsTicketsTimeline(prisma, widget);
        case 'prisma:business.operations.tickets.by_priority':
          return this.getBusinessOperationsTicketsByPriority(prisma, widget);
        case 'prisma:business.operations.sla.compliance_rate':
          return this.getBusinessOperationsSlaComplianceRate(prisma, widget);
        default:
          throw new Error(`Unsupported widget data source: ${widget.dataSource}`);
      }
    })();

    return validatePrismaDashboardWidgetOutput(widget, data);
  }

  private async getDashboardWidgetsCount(
    prisma: WidgetDataProviderContext['prisma'],
    widget: Widget,
    filters?: Filter[]
  ) {
    const total = await prisma.widget.count({
      where: {
        dashboardId: widget.dashboardId,
        ...this.buildWidgetFilterWhere(filters),
      },
    });

    return [
      {
        x: 'Widgets',
        y: total,
      },
    ];
  }

  private async getDashboardWidgetsByType(
    prisma: WidgetDataProviderContext['prisma'],
    widget: Widget,
    filters?: Filter[]
  ) {
    const grouped = await prisma.widget.groupBy({
      by: ['type'],
      where: {
        dashboardId: widget.dashboardId,
        ...this.buildWidgetFilterWhere(filters),
      },
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

  private async getDashboardWidgetsTimeline(
    prisma: WidgetDataProviderContext['prisma'],
    widget: Widget,
    filters?: Filter[]
  ) {
    const config = this.getConfigObject(widget.config);
    const days = this.getIntegerConfig(config, 'days', 14, 1, 365);
    const startDate = this.getStartDate(days);
    const widgetRows = await prisma.widget.findMany({
      where: {
        dashboardId: widget.dashboardId,
        createdAt: { gte: startDate },
        ...this.buildWidgetFilterWhere(filters),
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

  private async getDashboardActiveSchedulesCount(
    prisma: WidgetDataProviderContext['prisma'],
    widget: Widget,
    filters?: Filter[]
  ) {
    const total = await prisma.schedule.count({
      where: {
        dashboardId: widget.dashboardId,
        isActive: true,
        ...this.buildScheduleFilterWhere(filters),
      },
    });

    return [
      {
        x: 'Active Schedules',
        y: total,
      },
    ];
  }

  private async getDashboardUpcomingSchedules(
    prisma: WidgetDataProviderContext['prisma'],
    widget: Widget,
    filters?: Filter[]
  ) {
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
        ...this.buildScheduleFilterWhere(filters),
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

  private async getBusinessSalesRevenueTotal(
    prisma: WidgetDataProviderContext['prisma'],
    widget: Widget
  ) {
    const aggregated = await prisma.salesOrder.aggregate({
      where: {
        dashboardId: widget.dashboardId,
      },
      _sum: {
        totalAmount: true,
      },
    });

    return [
      {
        x: 'Revenue',
        y: Number(aggregated._sum.totalAmount ?? 0),
      },
    ];
  }

  private async getBusinessSalesRevenueTimeline(
    prisma: WidgetDataProviderContext['prisma'],
    widget: Widget
  ) {
    const config = this.getConfigObject(widget.config);
    const days = this.getIntegerConfig(config, 'days', 30, 1, 365);
    const startDate = this.getStartDate(days);

    const orders = await prisma.salesOrder.findMany({
      where: {
        dashboardId: widget.dashboardId,
        orderDate: { gte: startDate },
      },
      select: {
        orderDate: true,
        totalAmount: true,
      },
      orderBy: {
        orderDate: 'asc',
      },
    });

    const totalsByDay = this.createSeededDailyMap(days, startDate, 0);
    for (const order of orders) {
      const key = this.toDayKey(order.orderDate);
      totalsByDay.set(key, (totalsByDay.get(key) ?? 0) + Number(order.totalAmount ?? 0));
    }

    const points = Array.from(totalsByDay.entries()).map(([date, value]) => ({
      date,
      value: Number(value.toFixed(2)),
    }));

    if (widget.type === WidgetType.TABLE) {
      return points;
    }

    return points.map((point) => ({
      x: point.date,
      y: point.value,
    }));
  }

  private async getBusinessSalesOrdersGrouped(
    prisma: WidgetDataProviderContext['prisma'],
    widget: Widget,
    field: 'status' | 'region' | 'channel'
  ) {
    const grouped = (await (prisma.salesOrder.groupBy as any)({
      by: [field],
      where: {
        dashboardId: widget.dashboardId,
      },
      _count: {
        _all: true,
      },
      orderBy: {
        [field]: 'asc',
      },
    })) as Array<{ _count: { _all: number }; [key: string]: unknown }>;

    const rows = grouped.map((row) => ({
      label: String(row[field]),
      count: row._count._all,
    }));

    if (widget.type === WidgetType.TABLE) {
      return rows;
    }

    return rows.map((row) => ({
      x: row.label,
      y: row.count,
    }));
  }

  private async getBusinessMarketingLeadsConversionRate(
    prisma: WidgetDataProviderContext['prisma'],
    widget: Widget
  ) {
    const [totalLeads, convertedLeads] = await Promise.all([
      prisma.marketingLead.count({
        where: {
          dashboardId: widget.dashboardId,
        },
      }),
      prisma.marketingLead.count({
        where: {
          dashboardId: widget.dashboardId,
          isConverted: true,
        },
      }),
    ]);

    const rate = totalLeads === 0 ? 0 : Number(((convertedLeads / totalLeads) * 100).toFixed(2));

    return [
      {
        x: 'Conversion Rate',
        y: rate,
      },
    ];
  }

  private async getBusinessMarketingLeadsTimeline(
    prisma: WidgetDataProviderContext['prisma'],
    widget: Widget
  ) {
    const config = this.getConfigObject(widget.config);
    const days = this.getIntegerConfig(config, 'days', 30, 1, 365);
    const startDate = this.getStartDate(days);

    const leads = await prisma.marketingLead.findMany({
      where: {
        dashboardId: widget.dashboardId,
        capturedAt: { gte: startDate },
      },
      select: {
        capturedAt: true,
      },
      orderBy: {
        capturedAt: 'asc',
      },
    });

    const countsByDay = this.createSeededDailyMap(days, startDate, 0);
    for (const lead of leads) {
      const key = this.toDayKey(lead.capturedAt);
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

  private async getBusinessMarketingLeadsGrouped(
    prisma: WidgetDataProviderContext['prisma'],
    widget: Widget,
    field: 'channel' | 'stage'
  ) {
    const grouped = (await (prisma.marketingLead.groupBy as any)({
      by: [field],
      where: {
        dashboardId: widget.dashboardId,
      },
      _count: {
        _all: true,
      },
      orderBy: {
        [field]: 'asc',
      },
    })) as Array<{ _count: { _all: number }; [key: string]: unknown }>;

    const rows = grouped.map((row) => ({
      label: String(row[field]),
      count: row._count._all,
    }));

    if (widget.type === WidgetType.TABLE) {
      return rows;
    }

    return rows.map((row) => ({
      x: row.label,
      y: row.count,
    }));
  }

  private async getBusinessOperationsTicketsOpenCount(
    prisma: WidgetDataProviderContext['prisma'],
    widget: Widget
  ) {
    const total = await prisma.operationsTicket.count({
      where: {
        dashboardId: widget.dashboardId,
        status: {
          in: [...OPEN_OPERATIONS_TICKET_STATUSES],
        },
      },
    });

    return [
      {
        x: 'Open Tickets',
        y: total,
      },
    ];
  }

  private async getBusinessOperationsTicketsTimeline(
    prisma: WidgetDataProviderContext['prisma'],
    widget: Widget
  ) {
    const config = this.getConfigObject(widget.config);
    const days = this.getIntegerConfig(config, 'days', 30, 1, 365);
    const startDate = this.getStartDate(days);

    const tickets = await prisma.operationsTicket.findMany({
      where: {
        dashboardId: widget.dashboardId,
        openedAt: { gte: startDate },
      },
      select: {
        openedAt: true,
      },
      orderBy: {
        openedAt: 'asc',
      },
    });

    const countsByDay = this.createSeededDailyMap(days, startDate, 0);
    for (const ticket of tickets) {
      const key = this.toDayKey(ticket.openedAt);
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

  private async getBusinessOperationsTicketsByPriority(
    prisma: WidgetDataProviderContext['prisma'],
    widget: Widget
  ) {
    const grouped = await prisma.operationsTicket.groupBy({
      by: ['priority'],
      where: {
        dashboardId: widget.dashboardId,
      },
      _count: {
        _all: true,
      },
      orderBy: {
        priority: 'asc',
      },
    });

    const rows = grouped.map((row) => ({
      label: row.priority,
      count: row._count._all,
    }));

    if (widget.type === WidgetType.TABLE) {
      return rows;
    }

    return rows.map((row) => ({
      x: row.label,
      y: row.count,
    }));
  }

  private async getBusinessOperationsSlaComplianceRate(
    prisma: WidgetDataProviderContext['prisma'],
    widget: Widget
  ) {
    const [resolvedCount, compliantCount] = await Promise.all([
      prisma.operationsTicket.count({
        where: {
          dashboardId: widget.dashboardId,
          resolvedAt: { not: null },
        },
      }),
      prisma.operationsTicket.count({
        where: {
          dashboardId: widget.dashboardId,
          resolvedAt: { not: null },
          slaBreached: false,
        },
      }),
    ]);

    const rate = resolvedCount === 0 ? 0 : Number(((compliantCount / resolvedCount) * 100).toFixed(2));

    return [
      {
        x: 'SLA Compliance',
        y: rate,
      },
    ];
  }

  private buildWidgetFilterWhere(filters?: Filter[]): Prisma.WidgetWhereInput {
    const conditions = (filters ?? [])
      .map((filter) => this.buildWidgetFilterCondition(filter))
      .filter((condition): condition is Prisma.WidgetWhereInput => condition !== null);

    if (conditions.length === 0) {
      return {};
    }

    return { AND: conditions };
  }

  private buildScheduleFilterWhere(filters?: Filter[]): Prisma.ScheduleWhereInput {
    const conditions = (filters ?? [])
      .map((filter) => this.buildScheduleFilterCondition(filter))
      .filter((condition): condition is Prisma.ScheduleWhereInput => condition !== null);

    if (conditions.length === 0) {
      return {};
    }

    return { AND: conditions };
  }

  private buildWidgetFilterCondition(filter: Filter): Prisma.WidgetWhereInput | null {
    const field = this.normalizeFieldName(filter.field);

    switch (field) {
      case 'type':
      case 'widgettype':
      case 'category':
        return this.buildWidgetTypeCondition(filter);
      case 'title':
      case 'name':
        return this.buildStringFieldCondition<Prisma.WidgetWhereInput>('title', filter);
      case 'datasource':
      case 'source':
        return this.buildStringFieldCondition<Prisma.WidgetWhereInput>('dataSource', filter);
      case 'createdat':
      case 'date':
        return this.buildDateFieldCondition<Prisma.WidgetWhereInput>('createdAt', filter);
      case 'updatedat':
        return this.buildDateFieldCondition<Prisma.WidgetWhereInput>('updatedAt', filter);
      default:
        return null;
    }
  }

  private buildScheduleFilterCondition(filter: Filter): Prisma.ScheduleWhereInput | null {
    const field = this.normalizeFieldName(filter.field);

    switch (field) {
      case 'status':
      case 'isactive':
        return this.buildBooleanFieldCondition<Prisma.ScheduleWhereInput>('isActive', filter, {
          activeLabelSupport: true,
        });
      case 'name':
        return this.buildStringFieldCondition<Prisma.ScheduleWhereInput>('name', filter);
      case 'cronexpr':
      case 'cron':
        return this.buildStringFieldCondition<Prisma.ScheduleWhereInput>('cronExpr', filter);
      case 'nextrun':
      case 'date':
        return this.buildDateFieldCondition<Prisma.ScheduleWhereInput>('nextRun', filter);
      case 'lastrun':
        return this.buildDateFieldCondition<Prisma.ScheduleWhereInput>('lastRun', filter);
      case 'recipient':
      case 'recipients':
        return this.buildRecipientsCondition(filter);
      default:
        return null;
    }
  }

  private buildWidgetTypeCondition(filter: Filter): Prisma.WidgetWhereInput | null {
    switch (filter.operator) {
      case 'eq': {
        const value = this.parseWidgetTypeValue(filter.value);
        return value ? ({ type: value } as Prisma.WidgetWhereInput) : null;
      }
      case 'ne': {
        const value = this.parseWidgetTypeValue(filter.value);
        return value ? ({ NOT: { type: value } } as Prisma.WidgetWhereInput) : null;
      }
      case 'in': {
        const values = this.parseWidgetTypeList(filter.value);
        return values ? ({ type: { in: values } } as Prisma.WidgetWhereInput) : null;
      }
      default:
        return null;
    }
  }

  private buildStringFieldCondition<TWhere extends Record<string, unknown>>(
    fieldName: string,
    filter: Filter
  ): TWhere | null {
    switch (filter.operator) {
      case 'eq': {
        const value = this.parseStringValue(filter.value);
        return value !== null ? ({ [fieldName]: value } as TWhere) : null;
      }
      case 'ne': {
        const value = this.parseStringValue(filter.value);
        return value !== null ? ({ NOT: { [fieldName]: value } } as unknown as TWhere) : null;
      }
      case 'contains': {
        const value = this.parseStringValue(filter.value);
        return value !== null
          ? ({ [fieldName]: { contains: value, mode: 'insensitive' } } as TWhere)
          : null;
      }
      case 'in': {
        const values = this.parseStringList(filter.value);
        return values ? ({ [fieldName]: { in: values } } as TWhere) : null;
      }
      default:
        return null;
    }
  }

  private buildBooleanFieldCondition<TWhere extends Record<string, unknown>>(
    fieldName: string,
    filter: Filter,
    options?: { activeLabelSupport?: boolean }
  ): TWhere | null {
    switch (filter.operator) {
      case 'eq': {
        const value = this.parseBooleanValue(filter.value, options);
        return value !== null ? ({ [fieldName]: value } as TWhere) : null;
      }
      case 'ne': {
        const value = this.parseBooleanValue(filter.value, options);
        return value !== null ? ({ NOT: { [fieldName]: value } } as unknown as TWhere) : null;
      }
      default:
        return null;
    }
  }

  private buildDateFieldCondition<TWhere extends Record<string, unknown>>(
    fieldName: string,
    filter: Filter
  ): TWhere | null {
    const value = this.parseDateValue(filter.value);
    if (!value) {
      return null;
    }

    switch (filter.operator) {
      case 'eq':
        return { [fieldName]: value } as TWhere;
      case 'ne':
        return { NOT: { [fieldName]: value } } as unknown as TWhere;
      case 'gt':
      case 'gte':
      case 'lt':
      case 'lte':
        return { [fieldName]: { [filter.operator]: value } } as TWhere;
      default:
        return null;
    }
  }

  private buildRecipientsCondition(filter: Filter): Prisma.ScheduleWhereInput | null {
    switch (filter.operator) {
      case 'eq':
      case 'contains': {
        const value = this.parseStringValue(filter.value);
        return value !== null ? ({ recipients: { has: value } } as Prisma.ScheduleWhereInput) : null;
      }
      case 'ne': {
        const value = this.parseStringValue(filter.value);
        return value !== null
          ? ({ NOT: { recipients: { has: value } } } as Prisma.ScheduleWhereInput)
          : null;
      }
      case 'in': {
        const values = this.parseStringList(filter.value);
        return values
          ? ({ recipients: { hasSome: values } } as Prisma.ScheduleWhereInput)
          : null;
      }
      default:
        return null;
    }
  }

  private normalizeFieldName(field: string): string {
    return field.trim().toLowerCase().replace(/[\s_.-]/g, '');
  }

  private parseStringValue(value: unknown): string | null {
    if (typeof value !== 'string') {
      if (typeof value === 'number' || typeof value === 'boolean') {
        return String(value);
      }
      return null;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private parseStringList(value: unknown): string[] | null {
    if (Array.isArray(value)) {
      const normalized = value
        .map((item) => this.parseStringValue(item))
        .filter((item): item is string => item !== null);

      return normalized.length > 0 ? normalized : null;
    }

    const single = this.parseStringValue(value);
    if (!single) {
      return null;
    }

    const parts = single
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    return parts.length > 0 ? parts : null;
  }

  private parseWidgetTypeValue(value: unknown): WidgetType | null {
    const raw = this.parseStringValue(value);
    if (!raw) {
      return null;
    }

    const normalized = raw.toUpperCase().replace(/[\s-]+/g, '_');
    return Object.values(WidgetType).includes(normalized as WidgetType)
      ? (normalized as WidgetType)
      : null;
  }

  private parseWidgetTypeList(value: unknown): WidgetType[] | null {
    const values = Array.isArray(value) ? value : this.parseStringList(value);
    const normalized = (Array.isArray(values) ? values : [])
      .map((item) => this.parseWidgetTypeValue(item))
      .filter((item): item is WidgetType => item !== null);

    return normalized.length > 0 ? normalized : null;
  }

  private parseBooleanValue(
    value: unknown,
    options?: { activeLabelSupport?: boolean }
  ): boolean | null {
    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'number') {
      if (value === 1) return true;
      if (value === 0) return false;
      return null;
    }

    const raw = this.parseStringValue(value);
    if (!raw) {
      return null;
    }

    const normalized = raw.toLowerCase();
    if (['true', '1', 'yes', 'y', 'sim'].includes(normalized)) {
      return true;
    }
    if (['false', '0', 'no', 'n', 'nao'].includes(normalized)) {
      return false;
    }

    if (options?.activeLabelSupport) {
      if (['active', 'ativo', 'enabled'].includes(normalized)) {
        return true;
      }
      if (['inactive', 'inativo', 'disabled'].includes(normalized)) {
        return false;
      }
    }

    return null;
  }

  private parseDateValue(value: unknown): Date | null {
    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? null : value;
    }

    if (typeof value !== 'string' && typeof value !== 'number') {
      return null;
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  private toDayKey(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  private createSeededDailyMap(days: number, startDate: Date, initialValue: number): Map<string, number> {
    const values = new Map<string, number>();

    for (let offset = 0; offset < days; offset += 1) {
      const day = new Date(startDate);
      day.setUTCDate(startDate.getUTCDate() + offset);
      values.set(this.toDayKey(day), initialValue);
    }

    return values;
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
