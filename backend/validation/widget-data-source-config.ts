import { WidgetType } from '@prisma/client';
import {
  isPrismaDashboardDataSource,
  validatePrismaDashboardWidgetConfig,
} from '@/backend/services/widget-data/prisma-dashboard-contracts';

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

  return validatePrismaDashboardWidgetConfig(dataSource, config, widgetType);
}

export { supportedPrismaDashboardDataSources } from '@/backend/services/widget-data/prisma-dashboard-contracts';
