'use client';

import { useMemo } from 'react';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { Widget } from '@/lib/types';
import { WidgetCard } from './WidgetCard';
import { WidgetContainer } from './WidgetContainer';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface WidgetGridProps {
    widgets: Widget[];
    isEditable?: boolean;
    onLayoutChange?: (layout: Layout[]) => void;
    onRemoveWidget?: (widgetId: string) => void;
}

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

    return (
        <ResponsiveGridLayout
            className="layout"
            layouts={layouts}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
            rowHeight={100}
            isDraggable={isEditable}
            isResizable={isEditable}
            onLayoutChange={(layout: Layout[]) => onLayoutChange?.(layout)}
            margin={[24, 24]}
        >
            {widgets.map((widget) => (
                <div key={widget.id} className="animate-in zoom-in duration-500">
                    <WidgetCard
                        title={widget.title}
                        onRemove={isEditable && onRemoveWidget ? () => onRemoveWidget(widget.id) : undefined}
                        className="h-full"
                    >
                        <WidgetContainer widget={widget} />
                    </WidgetCard>
                </div>
            ))}
        </ResponsiveGridLayout>
    );
}
