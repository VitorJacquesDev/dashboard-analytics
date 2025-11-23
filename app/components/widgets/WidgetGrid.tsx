'use client';

import { useMemo } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { Widget, WidgetType, ChartData } from '@/lib/types';
import { WidgetCard } from './WidgetCard';
import { LineChart } from '../charts/LineChart';
import { BarChart } from '../charts/BarChart';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface WidgetGridProps {
    widgets: Widget[];
    isEditable?: boolean;
    onLayoutChange?: (layout: any) => void;
    onRemoveWidget?: (widgetId: string) => void;
}

// Mock data generator for demonstration
const getMockData = (type: WidgetType): ChartData[] => {
    return Array.from({ length: 7 }, (_, i) => ({
        x: `Day ${i + 1}`,
        y: Math.floor(Math.random() * 100),
    }));
};

export function WidgetGrid({ widgets, isEditable = false, onLayoutChange, onRemoveWidget }: WidgetGridProps) {
    const layouts = useMemo(() => {
        return {
            lg: widgets.map((widget, i) => ({
                i: widget.id,
                x: (i * 4) % 12,
                y: Math.floor(i / 3) * 4,
                w: 4,
                h: 4,
                minW: 2,
                minH: 3,
            })),
        };
    }, [widgets]);

    const renderWidgetContent = (widget: Widget) => {
        const data = getMockData(widget.type); // In real app, fetch data based on widget.dataSource

        switch (widget.type) {
            case WidgetType.LINE_CHART:
                return <LineChart data={data} />;
            case WidgetType.BAR_CHART:
                return <BarChart data={data} />;
            default:
                return (
                    <div className="flex items-center justify-center h-full text-slate-400">
                        {widget.type} not implemented yet
                    </div>
                );
        }
    };

    return (
        <ResponsiveGridLayout
            className="layout"
            layouts={layouts}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
            rowHeight={100}
            isDraggable={isEditable}
            isResizable={isEditable}
            onLayoutChange={(layout) => onLayoutChange?.(layout)}
            margin={[16, 16]}
        >
            {widgets.map((widget) => (
                <div key={widget.id}>
                    <WidgetCard
                        title={widget.title}
                        onRemove={isEditable && onRemoveWidget ? () => onRemoveWidget(widget.id) : undefined}
                        className="h-full"
                    >
                        {renderWidgetContent(widget)}
                    </WidgetCard>
                </div>
            ))}
        </ResponsiveGridLayout>
    );
}
