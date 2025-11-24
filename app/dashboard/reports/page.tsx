'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { exportToPDF } from '@/lib/exportUtils';

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
                const response = await fetch('/api/dashboards', {
                    credentials: 'include',
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch dashboards');
                }

                const data = await response.json();
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
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-slate-600 dark:text-slate-400">Loading reports...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="text-red-500 text-5xl mb-4">⚠️</div>
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Error Loading Reports</h2>
                    <p className="text-slate-600 dark:text-slate-400">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Reports</h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">
                        View and export your dashboards
                    </p>
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400">
                    {dashboards.length} {dashboards.length === 1 ? 'dashboard' : 'dashboards'}
                </div>
            </div>

            {dashboards.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="text-6xl mb-4">📊</div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                        No dashboards yet
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400">
                        Create your first dashboard to see it here
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {dashboards.map((dashboard) => (
                        <div
                            key={dashboard.id}
                            className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg transition-shadow"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                                        {dashboard.title}
                                    </h3>
                                    {dashboard.description && (
                                        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                                            {dashboard.description}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                                <span>
                                    {dashboard.widgetCount || 0} {dashboard.widgetCount === 1 ? 'widget' : 'widgets'}
                                </span>
                                <span>
                                    Updated {new Date(dashboard.updatedAt).toLocaleDateString()}
                                </span>
                            </div>

                            <div className="space-y-2">
                                <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Export as:
                                </p>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => handleExport(dashboard.id, 'pdf')}
                                        disabled={exportingId === dashboard.id}
                                        className="flex-1 px-3 py-2 bg-red-50 text-red-700 rounded text-xs font-medium hover:bg-red-100 transition-colors dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {exportingId === dashboard.id ? '...' : 'PDF'}
                                    </button>
                                    <button
                                        onClick={() => handleExport(dashboard.id, 'csv')}
                                        disabled={exportingId === dashboard.id}
                                        className="flex-1 px-3 py-2 bg-green-50 text-green-700 rounded text-xs font-medium hover:bg-green-100 transition-colors dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        CSV
                                    </button>
                                    <button
                                        onClick={() => handleExport(dashboard.id, 'xlsx')}
                                        disabled={exportingId === dashboard.id}
                                        className="flex-1 px-3 py-2 bg-blue-50 text-blue-700 rounded text-xs font-medium hover:bg-blue-100 transition-colors dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
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
