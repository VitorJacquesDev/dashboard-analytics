import { WidgetType, type WidgetType as WidgetTypeValue } from '@/lib/types';

export type PrismaDashboardWidgetDataSourceId =
  | 'prisma:dashboard.widgets.count'
  | 'prisma:dashboard.widgets.by_type'
  | 'prisma:dashboard.widgets.timeline'
  | 'prisma:dashboard.schedules.active_count'
  | 'prisma:dashboard.schedules.upcoming';

export type PrismaDashboardWidgetDataSourceConfigMode = 'none' | 'timeline' | 'upcoming';

export interface PrismaDashboardWidgetDataSourceCatalogEntry {
  dataSource: PrismaDashboardWidgetDataSourceId;
  label: string;
  description: string;
  defaultTitle: string;
  defaultType: WidgetTypeValue;
  allowedTypes: readonly WidgetTypeValue[];
  configMode: PrismaDashboardWidgetDataSourceConfigMode;
}

export const PRISMA_DASHBOARD_WIDGET_DATA_SOURCE_CATALOG =
  [
    {
      dataSource: 'prisma:dashboard.widgets.count',
      label: 'Prisma · Total Widgets',
      description: 'Métrica com total de widgets do dashboard atual',
      defaultTitle: 'Total de Widgets',
      defaultType: WidgetType.METRIC,
      allowedTypes: [WidgetType.METRIC],
      configMode: 'none',
    },
    {
      dataSource: 'prisma:dashboard.widgets.by_type',
      label: 'Prisma · Widgets por Tipo',
      description: 'Agrupa widgets do dashboard por tipo',
      defaultTitle: 'Widgets por Tipo',
      defaultType: WidgetType.BAR_CHART,
      allowedTypes: [WidgetType.BAR_CHART, WidgetType.PIE_CHART, WidgetType.TABLE],
      configMode: 'none',
    },
    {
      dataSource: 'prisma:dashboard.widgets.timeline',
      label: 'Prisma · Widgets por Dia',
      description: 'Timeline de widgets criados no dashboard',
      defaultTitle: 'Widgets Criados por Dia',
      defaultType: WidgetType.LINE_CHART,
      allowedTypes: [WidgetType.LINE_CHART, WidgetType.AREA_CHART, WidgetType.BAR_CHART, WidgetType.TABLE],
      configMode: 'timeline',
    },
    {
      dataSource: 'prisma:dashboard.schedules.active_count',
      label: 'Prisma · Agendamentos Ativos',
      description: 'Métrica com agendamentos ativos deste dashboard',
      defaultTitle: 'Agendamentos Ativos',
      defaultType: WidgetType.METRIC,
      allowedTypes: [WidgetType.METRIC],
      configMode: 'none',
    },
    {
      dataSource: 'prisma:dashboard.schedules.upcoming',
      label: 'Prisma · Próximos Agendamentos',
      description: 'Tabela com próximos envios agendados do dashboard',
      defaultTitle: 'Próximos Agendamentos',
      defaultType: WidgetType.TABLE,
      allowedTypes: [WidgetType.TABLE],
      configMode: 'upcoming',
    },
  ] as const satisfies readonly PrismaDashboardWidgetDataSourceCatalogEntry[];

export const PRISMA_DASHBOARD_WIDGET_DATA_SOURCE_IDS =
  PRISMA_DASHBOARD_WIDGET_DATA_SOURCE_CATALOG.map(
    (entry) => entry.dataSource
  ) as PrismaDashboardWidgetDataSourceId[];

export const PRISMA_DASHBOARD_WIDGET_DATA_SOURCE_BY_ID = new Map(
  PRISMA_DASHBOARD_WIDGET_DATA_SOURCE_CATALOG.map((entry) => [entry.dataSource, entry] as const)
);
