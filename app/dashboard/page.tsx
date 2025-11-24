'use client';

import { useEffect, useState } from 'react';
import { useDashboardStore } from '@/store/useDashboardStore';
import { WidgetGrid } from '@/app/components/widgets/WidgetGrid';
import { FilterBar } from '@/app/components/dashboard/FilterBar';
import { WidgetType, Dashboard } from '@/lib/types';
import { exportToPDF } from '@/lib/exportUtils';
import { apiClient } from '@/lib/api-client';

export default function DashboardPage() {
    const { widgets, setWidgets, addWidget, removeWidget } = useDashboardStore();
    const [isEditable, setIsEditable] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentDashboard, setCurrentDashboard] = useState<Dashboard | null>(null);

    // Fetch dashboards and widgets from API
    useEffect(() => {
        const loadDashboardData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Fetch all dashboards for the user
                const dashboards = await apiClient.get<Dashboard[]>('/dashboards');

                if (dashboards && dashboards.length > 0) {
                    // Use the first dashboard
                    const dashboard = dashboards[0];
                    setCurrentDashboard(dashboard);

                    // Fetch widgets for this dashboard
                    const dashboardWidgets = await apiClient.get<any[]>(`/dashboards/${dashboard.id}/widgets`);
                    setWidgets(dashboardWidgets);
                } else {
                    // No dashboards available, show empty state
                    setError('No dashboards found. Please create a dashboard first.');
                }
            } catch (err: any) {
                console.error('Error loading dashboard data:', err);
                setError(err.message || 'Failed to load dashboard data');
            } finally {
                setLoading(false);
            }
        };

        loadDashboardData();
    }, [setWidgets]);

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

    const handleExportPDF = async () => {
        setIsExporting(true);
        await exportToPDF('dashboard-content', 'my-dashboard');
        setIsExporting(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-slate-600 dark:text-slate-400">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center max-w-md">
                    <div className="text-red-500 text-5xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Error Loading Dashboard</h2>
                    <p className="text-slate-600 dark:text-slate-400">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-all"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                        {currentDashboard?.title || 'My Dashboard'}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        {currentDashboard?.description || 'Real-time overview and analytics'}
                    </p>
                </div>
                <div className="flex items-center space-x-3">
                    <button
                        onClick={handleExportPDF}
                        disabled={isExporting}
                        className="px-4 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all shadow-sm hover:shadow-md disabled:opacity-50"
                    >
                        {isExporting ? 'Exporting...' : '📄 Export PDF'}
                    </button>
                    <button
                        onClick={() => setIsEditable(!isEditable)}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm hover:shadow-md ${isEditable
                            ? 'bg-indigo-100 text-indigo-700 border border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800'
                            : 'bg-white text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                            }`}
                    >
                        {isEditable ? '✓ Done Editing' : '✏️ Edit Layout'}
                    </button>
                    <button
                        onClick={handleAddWidget}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:-translate-y-0.5"
                    >
                        + Add Widget
                    </button>
                </div>
            </div>

            <FilterBar />

            <div id="dashboard-content" className="min-h-[600px] p-1">
                <WidgetGrid
                    widgets={widgets}
                    isEditable={isEditable}
                    onRemoveWidget={removeWidget}
                />
            </div>
        </div>
    );
}
