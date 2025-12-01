'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Layout } from 'react-grid-layout';
import { Dashboard, Widget } from '@/lib/types';
import { WidgetGrid } from '@/app/components/widgets/WidgetGrid';
import { FilterBar } from './FilterBar';
import { useSocket } from '@/app/providers/SocketProvider';
import { useDashboardStore } from '@/store/useDashboardStore';
import { apiClient } from '@/lib/api-client';

interface DashboardViewProps {
    dashboard: Dashboard;
    widgets: Widget[];
}

export function DashboardView({ dashboard, widgets }: DashboardViewProps) {
    const [isEditMode, setIsEditMode] = useState(false);
    const [localWidgets, setLocalWidgets] = useState<Widget[]>(widgets);
    const [isSaving, setIsSaving] = useState(false);
    const { socket, isConnected } = useSocket();
    const { updateWidget, activeFilters } = useDashboardStore();
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Sync local widgets with props
    useEffect(() => {
        setLocalWidgets(widgets);
    }, [widgets]);

    // WebSocket: Join dashboard room and listen for updates
    useEffect(() => {
        if (!socket || !isConnected || !dashboard.id) return;

        // Join dashboard room
        socket.emit('dashboard:join', dashboard.id);

        // Listen for widget updates
        socket.on('widget:update', (updatedWidget: Widget) => {
            if (updatedWidget.dashboardId === dashboard.id) {
                setLocalWidgets(prev => 
                    prev.map(w => w.id === updatedWidget.id ? updatedWidget : w)
                );
                updateWidget(updatedWidget);
            }
        });

        // Listen for dashboard updates
        socket.on('dashboard:update', (data: { dashboardId: string; widgets: Widget[] }) => {
            if (data.dashboardId === dashboard.id) {
                setLocalWidgets(data.widgets);
            }
        });

        return () => {
            socket.emit('dashboard:leave', dashboard.id);
            socket.off('widget:update');
            socket.off('dashboard:update');
        };
    }, [socket, isConnected, dashboard.id, updateWidget]);

    // Debounced layout save
    const saveLayout = useCallback(async (layout: Layout[]) => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        saveTimeoutRef.current = setTimeout(async () => {
            setIsSaving(true);
            try {
                await apiClient.put(`/dashboards/${dashboard.id}/layout`, { layout });
            } catch (error) {
                console.error('Failed to save layout:', error);
            } finally {
                setIsSaving(false);
            }
        }, 500); // 500ms debounce
    }, [dashboard.id]);

    // Handle layout change from grid
    const handleLayoutChange = useCallback((layout: Layout[]) => {
        if (isEditMode) {
            saveLayout(layout);
        }
    }, [isEditMode, saveLayout]);

    // Handle widget removal
    const handleRemoveWidget = useCallback(async (widgetId: string) => {
        try {
            await apiClient.delete(`/widgets/${widgetId}`);
            setLocalWidgets(prev => prev.filter(w => w.id !== widgetId));
        } catch (error) {
            console.error('Failed to remove widget:', error);
        }
    }, []);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, []);

    return (
        <div className="space-y-6">
            {/* Toolbar */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {isConnected && (
                        <span className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-full">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                            Live
                        </span>
                    )}
                    {isSaving && (
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                            Saving...
                        </span>
                    )}
                </div>
                
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsEditMode(!isEditMode)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            isEditMode
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                    >
                        {isEditMode ? '✓ Done Editing' : '✏️ Edit Layout'}
                    </button>
                </div>
            </div>

            {/* Filters */}
            <FilterBar />

            {/* Widget Grid */}
            {localWidgets.length > 0 ? (
                <WidgetGrid
                    widgets={localWidgets}
                    isEditable={isEditMode}
                    onLayoutChange={handleLayoutChange}
                    onRemoveWidget={handleRemoveWidget}
                />
            ) : (
                <div className="flex flex-col items-center justify-center h-[40vh] bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                    <div className="text-5xl mb-4">📈</div>
                    <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        No widgets yet
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
                        Add widgets to visualize your data
                    </p>
                    <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
                        + Add Widget
                    </button>
                </div>
            )}
        </div>
    );
}
