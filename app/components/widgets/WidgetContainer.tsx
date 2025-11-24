'use client';

import { Widget, WidgetType } from '@/lib/types';
import { useWidgetData } from '@/app/hooks/useWidgetData';
import { useDashboardStore } from '@/store/useDashboardStore';
import { LineChart } from '../charts/LineChart';
import { BarChart } from '../charts/BarChart';
import { PieChart } from '../charts/PieChart';
import { AreaChart } from '../charts/AreaChart';
import { ScatterChart } from '../charts/ScatterChart';
import { Heatmap } from '../charts/Heatmap';
import { TableWidget } from './TableWidget';
import { MetricWidget } from './MetricWidget';

interface WidgetContainerProps {
    widget: Widget;
}

export function WidgetContainer({ widget }: WidgetContainerProps) {
    const { activeFilters } = useDashboardStore();
    const { data, isLoading, error } = useWidgetData(widget.id, widget.dataSource, widget.config, activeFilters);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-full text-red-500 text-sm p-4 text-center">
                Error: {error}
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                No data available
            </div>
        );
    }

    switch (widget.type) {
        case WidgetType.LINE_CHART:
            return <LineChart data={data} config={widget.config} />;
        case WidgetType.BAR_CHART:
            return <BarChart data={data} config={widget.config} />;
        case WidgetType.PIE_CHART:
            return <PieChart data={data} config={widget.config} />;
        case WidgetType.AREA_CHART:
            return <AreaChart data={data} config={widget.config} />;
        case WidgetType.SCATTER_CHART:
            return <ScatterChart data={data} config={widget.config} />;
        case WidgetType.HEATMAP:
            return <Heatmap data={data} config={widget.config} />;
        case WidgetType.TABLE:
            return <TableWidget data={data} />;
        case WidgetType.METRIC:
            return <MetricWidget data={data} title={widget.title} />;
        default:
            return (
                <div className="flex items-center justify-center h-full text-slate-400">
                    {widget.type} not implemented yet
                </div>
            );
    }
}
