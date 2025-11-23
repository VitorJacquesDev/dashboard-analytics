'use client';

import { useEffect, useState } from 'react';
import { useDashboardStore } from '@/store/useDashboardStore';
import { WidgetGrid } from '@/app/components/widgets/WidgetGrid';
import { WidgetType } from '@/lib/types';

export default function DashboardPage() {
    const { widgets, setWidgets, addWidget, removeWidget } = useDashboardStore();
    const [isEditable, setIsEditable] = useState(false);

    // Load initial demo data if empty
    useEffect(() => {
        if (widgets.length === 0) {
            setWidgets([
                {
                    id: '1',
                    dashboardId: 'demo',
                    type: WidgetType.LINE_CHART,
                    title: 'Revenue Trend',
                    config: {},
                    dataSource: 'revenue',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    id: '2',
                    dashboardId: 'demo',
                    type: WidgetType.BAR_CHART,
                    title: 'User Acquisition',
                    config: {},
                    dataSource: 'users',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ]);
        }
    }, [widgets.length, setWidgets]);

    const handleAddWidget = () => {
        const newWidget = {
            id: Math.random().toString(36).substr(2, 9),
            dashboardId: 'demo',
            type: Math.random() > 0.5 ? WidgetType.LINE_CHART : WidgetType.BAR_CHART,
            title: 'New Widget',
            config: {},
            dataSource: 'demo',
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        addWidget(newWidget);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                    My Dashboard
                </h1>
                <div className="space-x-4">
                    <button
                        onClick={() => setIsEditable(!isEditable)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isEditable
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                                : 'bg-white text-slate-700 border border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                            }`}
                    >
                        {isEditable ? 'Done Editing' : 'Edit Layout'}
                    </button>
                    <button
                        onClick={handleAddWidget}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                        Add Widget
                    </button>
                </div>
            </div>

            <div className="min-h-[600px]">
                <WidgetGrid
                    widgets={widgets}
                    isEditable={isEditable}
                    onRemoveWidget={removeWidget}
                />
            </div>
        </div>
    );
}
