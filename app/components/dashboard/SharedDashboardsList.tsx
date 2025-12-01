'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { Dashboard } from '@/lib/types';

interface SharedDashboard extends Dashboard {
    sharedPermission: 'VIEW' | 'EDIT';
    sharedAt: string;
    owner: {
        id: string;
        name: string;
        email: string;
    };
}

interface SharedDashboardsListProps {
    onSelect: (dashboard: Dashboard) => void;
}

export function SharedDashboardsList({ onSelect }: SharedDashboardsListProps) {
    const [dashboards, setDashboards] = useState<SharedDashboard[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        fetchSharedDashboards();
    }, []);

    const fetchSharedDashboards = async () => {
        try {
            const data = await apiClient.get<SharedDashboard[]>('/dashboards/shared');
            setDashboards(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="p-4">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                    <div className="w-4 h-4 border-2 border-slate-300 border-t-indigo-600 rounded-full animate-spin" />
                    Loading shared dashboards...
                </div>
            </div>
        );
    }

    if (error) {
        return null; // Silently fail for shared dashboards
    }

    if (dashboards.length === 0) {
        return null; // Don't show section if no shared dashboards
    }

    return (
        <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mt-4">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center justify-between w-full text-left mb-3"
            >
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <span>👥</span>
                    Shared with me
                    <span className="px-1.5 py-0.5 text-xs bg-slate-100 dark:bg-slate-800 rounded-full">
                        {dashboards.length}
                    </span>
                </h3>
                <svg
                    className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isExpanded && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                    {dashboards.map(dashboard => (
                        <button
                            key={dashboard.id}
                            onClick={() => onSelect(dashboard)}
                            className="w-full flex items-start gap-3 p-3 rounded-xl text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                        >
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm flex-shrink-0">
                                📊
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium text-slate-900 dark:text-gray-200 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                        {dashboard.title}
                                    </p>
                                    <span className={`px-1.5 py-0.5 text-xs rounded ${
                                        dashboard.sharedPermission === 'EDIT'
                                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                            : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                                    }`}>
                                        {dashboard.sharedPermission === 'EDIT' ? 'Edit' : 'View'}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                    by {dashboard.owner.name}
                                </p>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
