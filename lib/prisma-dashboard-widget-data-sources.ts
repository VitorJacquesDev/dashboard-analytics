import { WidgetType, type WidgetType as WidgetTypeValue } from '@/lib/types';

export type PrismaDashboardWidgetDataSourceId =
  | 'prisma:dashboard.widgets.count'
  | 'prisma:dashboard.widgets.by_type'
  | 'prisma:dashboard.widgets.timeline'
  | 'prisma:dashboard.schedules.active_count'
  | 'prisma:dashboard.schedules.upcoming'
  | 'prisma:business.sales.revenue.total'
  | 'prisma:business.sales.revenue.timeline'
  | 'prisma:business.sales.orders.by_status'
  | 'prisma:business.sales.orders.by_region'
  | 'prisma:business.sales.orders.by_channel'
  | 'prisma:business.marketing.leads.conversion_rate'
  | 'prisma:business.marketing.leads.timeline'
  | 'prisma:business.marketing.leads.by_channel'
  | 'prisma:business.marketing.leads.by_stage'
  | 'prisma:business.operations.tickets.open_count'
  | 'prisma:business.operations.tickets.timeline'
  | 'prisma:business.operations.tickets.by_priority'
  | 'prisma:business.operations.sla.compliance_rate';

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
    {
      dataSource: 'prisma:business.sales.revenue.total',
      label: 'Prisma · Vendas · Receita Total',
      description: 'Métrica com soma da receita de pedidos do dashboard',
      defaultTitle: 'Receita Total',
      defaultType: WidgetType.METRIC,
      allowedTypes: [WidgetType.METRIC],
      configMode: 'none',
    },
    {
      dataSource: 'prisma:business.sales.revenue.timeline',
      label: 'Prisma · Vendas · Receita por Dia',
      description: 'Timeline de receita diária agregada dos pedidos',
      defaultTitle: 'Receita por Dia',
      defaultType: WidgetType.LINE_CHART,
      allowedTypes: [WidgetType.LINE_CHART, WidgetType.AREA_CHART, WidgetType.BAR_CHART, WidgetType.TABLE],
      configMode: 'timeline',
    },
    {
      dataSource: 'prisma:business.sales.orders.by_status',
      label: 'Prisma · Vendas · Pedidos por Status',
      description: 'Agrupa pedidos por status',
      defaultTitle: 'Pedidos por Status',
      defaultType: WidgetType.BAR_CHART,
      allowedTypes: [WidgetType.BAR_CHART, WidgetType.PIE_CHART, WidgetType.TABLE],
      configMode: 'none',
    },
    {
      dataSource: 'prisma:business.sales.orders.by_region',
      label: 'Prisma · Vendas · Pedidos por Região',
      description: 'Agrupa pedidos por região',
      defaultTitle: 'Pedidos por Região',
      defaultType: WidgetType.BAR_CHART,
      allowedTypes: [WidgetType.BAR_CHART, WidgetType.PIE_CHART, WidgetType.TABLE],
      configMode: 'none',
    },
    {
      dataSource: 'prisma:business.sales.orders.by_channel',
      label: 'Prisma · Vendas · Pedidos por Canal',
      description: 'Agrupa pedidos por canal de aquisição',
      defaultTitle: 'Pedidos por Canal',
      defaultType: WidgetType.PIE_CHART,
      allowedTypes: [WidgetType.BAR_CHART, WidgetType.PIE_CHART, WidgetType.TABLE],
      configMode: 'none',
    },
    {
      dataSource: 'prisma:business.marketing.leads.conversion_rate',
      label: 'Prisma · Marketing · Taxa de Conversão',
      description: 'Métrica de taxa de conversão de leads',
      defaultTitle: 'Taxa de Conversão',
      defaultType: WidgetType.METRIC,
      allowedTypes: [WidgetType.METRIC],
      configMode: 'none',
    },
    {
      dataSource: 'prisma:business.marketing.leads.timeline',
      label: 'Prisma · Marketing · Leads por Dia',
      description: 'Timeline de leads capturados por dia',
      defaultTitle: 'Leads por Dia',
      defaultType: WidgetType.AREA_CHART,
      allowedTypes: [WidgetType.LINE_CHART, WidgetType.AREA_CHART, WidgetType.BAR_CHART, WidgetType.TABLE],
      configMode: 'timeline',
    },
    {
      dataSource: 'prisma:business.marketing.leads.by_channel',
      label: 'Prisma · Marketing · Leads por Canal',
      description: 'Agrupa leads por canal de origem',
      defaultTitle: 'Leads por Canal',
      defaultType: WidgetType.BAR_CHART,
      allowedTypes: [WidgetType.BAR_CHART, WidgetType.PIE_CHART, WidgetType.TABLE],
      configMode: 'none',
    },
    {
      dataSource: 'prisma:business.marketing.leads.by_stage',
      label: 'Prisma · Marketing · Leads por Etapa',
      description: 'Agrupa leads por etapa do funil',
      defaultTitle: 'Funil por Etapa',
      defaultType: WidgetType.BAR_CHART,
      allowedTypes: [WidgetType.BAR_CHART, WidgetType.PIE_CHART, WidgetType.TABLE],
      configMode: 'none',
    },
    {
      dataSource: 'prisma:business.operations.tickets.open_count',
      label: 'Prisma · Operações · Tickets Abertos',
      description: 'Métrica com tickets operacionais em aberto',
      defaultTitle: 'Tickets Abertos',
      defaultType: WidgetType.METRIC,
      allowedTypes: [WidgetType.METRIC],
      configMode: 'none',
    },
    {
      dataSource: 'prisma:business.operations.tickets.timeline',
      label: 'Prisma · Operações · Tickets por Dia',
      description: 'Timeline de tickets abertos por dia',
      defaultTitle: 'Tickets por Dia',
      defaultType: WidgetType.LINE_CHART,
      allowedTypes: [WidgetType.LINE_CHART, WidgetType.AREA_CHART, WidgetType.BAR_CHART, WidgetType.TABLE],
      configMode: 'timeline',
    },
    {
      dataSource: 'prisma:business.operations.tickets.by_priority',
      label: 'Prisma · Operações · Tickets por Prioridade',
      description: 'Agrupa tickets por prioridade',
      defaultTitle: 'Tickets por Prioridade',
      defaultType: WidgetType.TABLE,
      allowedTypes: [WidgetType.BAR_CHART, WidgetType.PIE_CHART, WidgetType.TABLE],
      configMode: 'none',
    },
    {
      dataSource: 'prisma:business.operations.sla.compliance_rate',
      label: 'Prisma · Operações · SLA Compliance',
      description: 'Métrica de conformidade de SLA em tickets resolvidos',
      defaultTitle: 'SLA Compliance',
      defaultType: WidgetType.METRIC,
      allowedTypes: [WidgetType.METRIC],
      configMode: 'none',
    },
  ] as const satisfies readonly PrismaDashboardWidgetDataSourceCatalogEntry[];

export const PRISMA_DASHBOARD_WIDGET_DATA_SOURCE_IDS =
  PRISMA_DASHBOARD_WIDGET_DATA_SOURCE_CATALOG.map(
    (entry) => entry.dataSource
  ) as PrismaDashboardWidgetDataSourceId[];

export const PRISMA_DASHBOARD_WIDGET_DATA_SOURCE_BY_ID = new Map(
  PRISMA_DASHBOARD_WIDGET_DATA_SOURCE_CATALOG.map((entry) => [entry.dataSource, entry] as const)
);
