import { WidgetType } from '@prisma/client';
import { z, ZodError } from 'zod';
import type { Widget } from '@/lib/types';
import {
  PRISMA_DASHBOARD_WIDGET_DATA_SOURCE_IDS,
  type PrismaDashboardWidgetDataSourceId,
} from '@/lib/prisma-dashboard-widget-data-sources';

type WidgetConfig = Record<string, unknown>;

type PrismaDashboardWidgetDataSourceContract = {
  configSchema: z.ZodType<WidgetConfig>;
  outputSchema: (widgetType: WidgetType) => z.ZodTypeAny;
};

const passthroughObjectSchema = z.object({}).passthrough() as z.ZodType<WidgetConfig>;

const xyRowSchema = z
  .object({
    x: z.union([z.string(), z.number()]),
    y: z.number(),
  })
  .passthrough();

const xySeriesSchema = z.array(xyRowSchema);

const widgetsByTypeTableSchema = z.array(
  z
    .object({
      type: z.string(),
      count: z.number(),
    })
    .passthrough()
);

const widgetsTimelineTableSchema = z.array(
  z
    .object({
      date: z.string(),
      count: z.number(),
    })
    .passthrough()
);

const upcomingSchedulesTableSchema = z.array(
  z
    .object({
      name: z.string(),
      cronExpr: z.string(),
      isActive: z.string(),
      nextRun: z.string(),
      lastRun: z.string(),
      recipients: z.number(),
    })
    .passthrough()
);

const prismaDashboardTimelineConfigSchema = z
  .object({
    days: z.number().int().min(1).max(365).optional(),
  })
  .passthrough() as z.ZodType<WidgetConfig>;

const prismaDashboardUpcomingSchedulesConfigSchema = z
  .object({
    limit: z.number().int().min(1).max(100).optional(),
    includeInactive: z.boolean().optional(),
  })
  .passthrough() as z.ZodType<WidgetConfig>;

const PRISMA_DASHBOARD_WIDGET_DATA_SOURCE_CONTRACTS: Record<
  PrismaDashboardWidgetDataSourceId,
  PrismaDashboardWidgetDataSourceContract
> = {
  'prisma:dashboard.widgets.count': {
    configSchema: passthroughObjectSchema,
    outputSchema: () => xySeriesSchema,
  },
  'prisma:dashboard.widgets.by_type': {
    configSchema: passthroughObjectSchema,
    outputSchema: (widgetType) => (widgetType === WidgetType.TABLE ? widgetsByTypeTableSchema : xySeriesSchema),
  },
  'prisma:dashboard.widgets.timeline': {
    configSchema: prismaDashboardTimelineConfigSchema,
    outputSchema: (widgetType) => (widgetType === WidgetType.TABLE ? widgetsTimelineTableSchema : xySeriesSchema),
  },
  'prisma:dashboard.schedules.active_count': {
    configSchema: passthroughObjectSchema,
    outputSchema: () => xySeriesSchema,
  },
  'prisma:dashboard.schedules.upcoming': {
    configSchema: prismaDashboardUpcomingSchedulesConfigSchema,
    outputSchema: (widgetType) => {
      if (widgetType !== WidgetType.TABLE) {
        throw new Error('Unsupported widget type for data source prisma:dashboard.schedules.upcoming');
      }
      return upcomingSchedulesTableSchema;
    },
  },
};

function buildZodMessage(error: ZodError): string {
  const firstIssue = error.issues[0];
  if (!firstIssue) {
    return 'invalid payload';
  }

  const path = firstIssue.path.length > 0 ? `${firstIssue.path.join('.')}: ` : '';
  return `${path}${firstIssue.message}`;
}

export function isPrismaDashboardDataSource(
  dataSource: string
): dataSource is PrismaDashboardWidgetDataSourceId {
  return (PRISMA_DASHBOARD_WIDGET_DATA_SOURCE_IDS as string[]).includes(dataSource);
}

export function validatePrismaDashboardWidgetConfig(
  dataSource: PrismaDashboardWidgetDataSourceId,
  config: unknown,
  widgetType?: WidgetType
): WidgetConfig {
  const contract = PRISMA_DASHBOARD_WIDGET_DATA_SOURCE_CONTRACTS[dataSource];

  if (
    dataSource === 'prisma:dashboard.schedules.upcoming' &&
    widgetType !== undefined &&
    widgetType !== WidgetType.TABLE
  ) {
    throw new Error(
      'Invalid widget config: prisma:dashboard.schedules.upcoming requires widget type TABLE'
    );
  }

  try {
    return contract.configSchema.parse(config);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new Error(`Invalid widget config: ${buildZodMessage(error)}`);
    }
    throw error;
  }
}

export function validatePrismaDashboardWidgetOutput(
  widget: Pick<Widget, 'dataSource' | 'type'>,
  data: unknown
): any[] {
  if (!isPrismaDashboardDataSource(widget.dataSource)) {
    return data as any[];
  }

  const contract = PRISMA_DASHBOARD_WIDGET_DATA_SOURCE_CONTRACTS[widget.dataSource];
  const schema = contract.outputSchema(widget.type as WidgetType);

  try {
    return schema.parse(data) as any[];
  } catch (error) {
    if (error instanceof ZodError) {
      throw new Error(`Invalid widget data contract: ${buildZodMessage(error)}`);
    }
    throw error;
  }
}

export const supportedPrismaDashboardDataSources = [
  ...PRISMA_DASHBOARD_WIDGET_DATA_SOURCE_IDS,
] as PrismaDashboardWidgetDataSourceId[];
