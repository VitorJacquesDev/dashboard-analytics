import { WidgetType } from '@prisma/client';
import { ZodError, z } from 'zod';

const passthroughObjectSchema = z.object({}).passthrough();

const prismaDashboardTimelineConfigSchema = z
  .object({
    days: z.number().int().min(1).max(365).optional(),
  })
  .passthrough();

const prismaDashboardUpcomingSchedulesConfigSchema = z
  .object({
    limit: z.number().int().min(1).max(100).optional(),
    includeInactive: z.boolean().optional(),
  })
  .passthrough();

const PRISMA_DASHBOARD_CONFIG_SCHEMAS = {
  'prisma:dashboard.widgets.count': passthroughObjectSchema,
  'prisma:dashboard.widgets.by_type': passthroughObjectSchema,
  'prisma:dashboard.widgets.timeline': prismaDashboardTimelineConfigSchema,
  'prisma:dashboard.schedules.active_count': passthroughObjectSchema,
  'prisma:dashboard.schedules.upcoming': prismaDashboardUpcomingSchedulesConfigSchema,
} as const;

type PrismaDashboardDataSource = keyof typeof PRISMA_DASHBOARD_CONFIG_SCHEMAS;

function isPrismaDashboardDataSource(dataSource: string): dataSource is PrismaDashboardDataSource {
  return dataSource in PRISMA_DASHBOARD_CONFIG_SCHEMAS;
}

function buildZodMessage(error: ZodError): string {
  const firstIssue = error.issues[0];
  if (!firstIssue) {
    return 'invalid config payload';
  }

  const path = firstIssue.path.length > 0 ? `${firstIssue.path.join('.')}: ` : '';
  return `${path}${firstIssue.message}`;
}

export function validateWidgetConfigByDataSource(
  dataSource: string,
  config: unknown,
  widgetType?: WidgetType
): Record<string, unknown> {
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    throw new Error('Invalid widget config: Widget config must be an object');
  }

  if (!isPrismaDashboardDataSource(dataSource)) {
    return config as Record<string, unknown>;
  }

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
    return PRISMA_DASHBOARD_CONFIG_SCHEMAS[dataSource].parse(config);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new Error(`Invalid widget config: ${buildZodMessage(error)}`);
    }
    throw error;
  }
}

export const supportedPrismaDashboardDataSources = Object.keys(
  PRISMA_DASHBOARD_CONFIG_SCHEMAS
) as PrismaDashboardDataSource[];

