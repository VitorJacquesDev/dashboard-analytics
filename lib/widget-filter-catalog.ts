import type { Filter, Widget } from '@/lib/types';
import {
    PRISMA_DASHBOARD_WIDGET_DATA_SOURCE_BY_ID,
    type PrismaDashboardWidgetDataSourceId,
} from '@/lib/prisma-dashboard-widget-data-sources';

type FilterOperator = Filter['operator'];
type FilterProfileId = 'dashboardWidgets' | 'dashboardSchedules';

type FilterFieldCatalogEntry = {
    field: string;
    label: string;
    operators: readonly FilterOperator[];
    placeholder: string;
    description: string;
};

export interface AvailableFilterField extends FilterFieldCatalogEntry {
    supportedWidgetCount: number;
    domains: readonly string[];
}

export interface FilterCatalogForWidgets {
    fields: AvailableFilterField[];
    totalWidgets: number;
    filterableWidgets: number;
    unsupportedWidgets: number;
}

export const FILTER_OPERATOR_LABELS: Record<FilterOperator, string> = {
    eq: 'Equals',
    ne: 'Not equals',
    gt: 'Greater than',
    gte: 'Greater or equal',
    lt: 'Less than',
    lte: 'Less or equal',
    in: 'In list',
    contains: 'Contains',
};

const DASHBOARD_WIDGET_FILTER_FIELDS: readonly FilterFieldCatalogEntry[] = [
    {
        field: 'type',
        label: 'Widget Type',
        operators: ['eq', 'ne', 'in'],
        placeholder: 'Ex: BAR_CHART (ou BAR_CHART,PIE_CHART)',
        description: 'Tipo visual do widget (BAR_CHART, TABLE, METRIC...)',
    },
    {
        field: 'title',
        label: 'Widget Title',
        operators: ['eq', 'ne', 'contains', 'in'],
        placeholder: 'Ex: Revenue',
        description: 'Título configurado no widget',
    },
    {
        field: 'dataSource',
        label: 'Data Source',
        operators: ['eq', 'ne', 'contains', 'in'],
        placeholder: 'Ex: prisma:dashboard.widgets.timeline',
        description: 'ID da fonte de dados do widget',
    },
    {
        field: 'createdAt',
        label: 'Created At',
        operators: ['eq', 'ne', 'gt', 'gte', 'lt', 'lte'],
        placeholder: 'Ex: 2026-02-01',
        description: 'Data de criação do widget',
    },
    {
        field: 'updatedAt',
        label: 'Updated At',
        operators: ['eq', 'ne', 'gt', 'gte', 'lt', 'lte'],
        placeholder: 'Ex: 2026-02-15T10:30:00Z',
        description: 'Data de atualização do widget',
    },
];

const DASHBOARD_SCHEDULE_FILTER_FIELDS: readonly FilterFieldCatalogEntry[] = [
    {
        field: 'status',
        label: 'Schedule Status',
        operators: ['eq', 'ne'],
        placeholder: 'Ex: active / inactive',
        description: 'Status do agendamento (active/inactive)',
    },
    {
        field: 'name',
        label: 'Schedule Name',
        operators: ['eq', 'ne', 'contains', 'in'],
        placeholder: 'Ex: Weekly Report',
        description: 'Nome do agendamento',
    },
    {
        field: 'cronExpr',
        label: 'CRON',
        operators: ['eq', 'ne', 'contains', 'in'],
        placeholder: 'Ex: 0 9 * * 1',
        description: 'Expressão CRON do agendamento',
    },
    {
        field: 'nextRun',
        label: 'Next Run',
        operators: ['eq', 'ne', 'gt', 'gte', 'lt', 'lte'],
        placeholder: 'Ex: 2026-02-25T09:00:00Z',
        description: 'Próxima execução agendada',
    },
    {
        field: 'lastRun',
        label: 'Last Run',
        operators: ['eq', 'ne', 'gt', 'gte', 'lt', 'lte'],
        placeholder: 'Ex: 2026-02-24T09:00:00Z',
        description: 'Última execução do agendamento',
    },
    {
        field: 'recipients',
        label: 'Recipient',
        operators: ['eq', 'ne', 'contains', 'in'],
        placeholder: 'Ex: user@company.com',
        description: 'E-mail presente na lista de destinatários',
    },
];

const FILTER_FIELDS_BY_PROFILE: Record<FilterProfileId, readonly FilterFieldCatalogEntry[]> = {
    dashboardWidgets: DASHBOARD_WIDGET_FILTER_FIELDS,
    dashboardSchedules: DASHBOARD_SCHEDULE_FILTER_FIELDS,
};

const FILTER_PROFILE_LABELS: Record<FilterProfileId, string> = {
    dashboardWidgets: 'widgets',
    dashboardSchedules: 'schedules',
};

const PRISMA_DASHBOARD_FILTER_PROFILE_BY_DATA_SOURCE: Partial<Record<
    PrismaDashboardWidgetDataSourceId,
    FilterProfileId
>> = {
    'prisma:dashboard.widgets.count': 'dashboardWidgets',
    'prisma:dashboard.widgets.by_type': 'dashboardWidgets',
    'prisma:dashboard.widgets.timeline': 'dashboardWidgets',
    'prisma:dashboard.schedules.active_count': 'dashboardSchedules',
    'prisma:dashboard.schedules.upcoming': 'dashboardSchedules',
};

function resolveFilterProfile(dataSource: string): FilterProfileId | null {
    if (!PRISMA_DASHBOARD_WIDGET_DATA_SOURCE_BY_ID.has(dataSource as PrismaDashboardWidgetDataSourceId)) {
        return null;
    }

    return (
        PRISMA_DASHBOARD_FILTER_PROFILE_BY_DATA_SOURCE[dataSource as PrismaDashboardWidgetDataSourceId] ??
        null
    );
}

export function getFilterCatalogForWidgets(
    widgets: Array<Pick<Widget, 'dataSource'>>
): FilterCatalogForWidgets {
    const fieldsById = new Map<
        string,
        {
            entry: FilterFieldCatalogEntry;
            supportedWidgetCount: number;
            domains: Set<string>;
        }
    >();

    let filterableWidgets = 0;

    for (const widget of widgets) {
        const profile = resolveFilterProfile(widget.dataSource);
        if (!profile) {
            continue;
        }

        filterableWidgets += 1;
        const domainLabel = FILTER_PROFILE_LABELS[profile];

        for (const fieldEntry of FILTER_FIELDS_BY_PROFILE[profile]) {
            const existing = fieldsById.get(fieldEntry.field);

            if (!existing) {
                fieldsById.set(fieldEntry.field, {
                    entry: fieldEntry,
                    supportedWidgetCount: 1,
                    domains: new Set([domainLabel]),
                });
                continue;
            }

            existing.supportedWidgetCount += 1;
            existing.domains.add(domainLabel);
        }
    }

    const fields = Array.from(fieldsById.values())
        .map(({ entry, supportedWidgetCount, domains }) => ({
            ...entry,
            supportedWidgetCount,
            domains: Array.from(domains.values()).sort(),
        }))
        .sort((a, b) => a.label.localeCompare(b.label));

    return {
        fields,
        totalWidgets: widgets.length,
        filterableWidgets,
        unsupportedWidgets: Math.max(0, widgets.length - filterableWidgets),
    };
}
