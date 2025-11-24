'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { exportToPDF } from '@/lib/exportUtils';
import { apiClient } from '@/lib/api-client';

interface Dashboard {
    id: string;
    title: string;
    description: string;
    createdAt: string;
    updatedAt: string;
    widgetCount: number;
}

export default function ReportsPage() {
    const { user } = useAuthStore();
    const [dashboards, setDashboards] = useState<Dashboard[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [exportingId, setExportingId] = useState<string | null>(null);

    useEffect(() => {
        const fetchDashboards = async () => {
            try {
                const data = await apiClient.get<Dashboard[]>('/dashboards');
                setDashboards(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unknown error');
            } finally {
                setLoading(false);
            }
        };

        fetchDashboards();
    }, []);

    const handleExport = async (dashboardId: string, format: 'pdf' | 'csv' | 'xlsx') => {
        setExportingId(dashboardId);
        try {
            // For PDF, use the existing export utility
            if (format === 'pdf') {
                await exportToPDF(`dashboard-${dashboardId}`, `dashboard-${dashboardId}`);
            } else {
                // Placeholder for CSV/XLSX export
                alert(`Export to ${format.toUpperCase()} will be implemented soon`);
            }
        } catch (error) {
            console.error('Export failed:', error);
            alert('Export failed. Please try again.');
        } finally {
            setExportingId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-slate-600 dark:text-slate-400 font-medium">Loading reports...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center p-8 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/30">
                    <div className="text-red-500 text-5xl mb-4">⚠️</div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Error Loading Reports</h2>
                    <p className="text-slate-600 dark:text-slate-400">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Reports</h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-2 text-lg">
                        View and export your dashboards
                    </p>
                </div>
                <div className="px-4 py-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-300">
                    {dashboards.length} {dashboards.length === 1 ? 'dashboard' : 'dashboards'} available
                </div>
            </div>

            {dashboards.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="text-7xl mb-6 opacity-50">📊</div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                        No dashboards yet
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                        Create your first dashboard to start generating reports and insights.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {dashboards.map((dashboard) => (
                        <div
                            key={dashboard.id}
                            className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 p-6 shadow-lg shadow-slate-200/50 dark:shadow-black/20 hover:shadow-xl hover:shadow-slate-200/80 dark:hover:shadow-black/40 hover:-translate-y-1 transition-all duration-300"
                        >
                            <div className="flex items-start justify-between mb-6">
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                        {dashboard.title}
                                    </h3>
                                    {dashboard.description && (
                                        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                                            {dashboard.description}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400 mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
                                <span className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                                    {dashboard.widgetCount || 0} {dashboard.widgetCount === 1 ? 'widget' : 'widgets'}
                                </span>
                                <span>
                                    Updated {new Date(dashboard.updatedAt).toLocaleDateString()}
                                </span>
                            </div>

                            <div className="space-y-3">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                                    Export Options
                                </p>
                                <div className="flex space-x-3">
                                    <button
                                        onClick={() => handleExport(dashboard.id, 'pdf')}
                                        disabled={exportingId === dashboard.id}
                                        className="flex-1 px-3 py-2.5 bg-rose-50 text-rose-700 rounded-lg text-xs font-bold hover:bg-rose-100 transition-all hover:-translate-y-0.5 dark:bg-rose-900/20 dark:text-rose-400 dark:hover:bg-rose-900/30 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                                    >
                                        {exportingId === dashboard.id ? '...' : 'PDF'}
                                    </button>
                                    <button
                                        onClick={() => handleExport(dashboard.id, 'csv')}
                                        disabled={exportingId === dashboard.id}
                                        className="flex-1 px-3 py-2.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-all hover:-translate-y-0.5 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/30 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                                    >
                                        CSV
                                    </button>
                                    <button
                                        onClick={() => handleExport(dashboard.id, 'xlsx')}
                                        disabled={exportingId === dashboard.id}
                                        className="flex-1 px-3 py-2.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-100 transition-all hover:-translate-y-0.5 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                                    >
                                        XLSX
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
