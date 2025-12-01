'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/app/components/layout/MainLayout';
import { DashboardView } from '@/app/components/dashboard/DashboardView';
import { DashboardSelector } from '@/app/components/dashboard/DashboardSelector';
import { useAuthStore } from '@/store/useAuthStore';
import { useDashboardStore } from '@/store/useDashboardStore';
import { apiClient } from '@/lib/api-client';
import { Dashboard, Widget } from '@/lib/types';

interface DashboardWithWidgets extends Dashboard {
    widgets: Widget[];
}

export default function DashboardPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading: authLoading } = useAuthStore();
    const { 
        dashboards, 
        activeDashboard, 
        widgets,
        setDashboards, 
        setActiveDashboard, 
        setWidgets,
        setLoading,
        setError,
        isLoading 
    } = useDashboardStore();
    
    const [initialLoad, setInitialLoad] = useState(true);

    // Redirect if not authenticated
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, authLoading, router]);

    // Fetch dashboards on mount
    useEffect(() => {
        if (!isAuthenticated) return;

        const fetchDashboards = async () => {
            setLoading(true);
            try {
                const data = await apiClient.get<DashboardWithWidgets[]>('/dashboards');
                setDashboards(data);
                
                // Set first dashboard as active if none selected
                if (data.length > 0 && !activeDashboard) {
                    setActiveDashboard(data[0]);
                    setWidgets(data[0].widgets || []);
                }
            } catch (err: any) {
                setError(err.message || 'Failed to load dashboards');
            } finally {
                setLoading(false);
                setInitialLoad(false);
            }
        };

        fetchDashboards();
    }, [isAuthenticated]);

    // Handle dashboard selection
    const handleDashboardSelect = async (dashboard: Dashboard) => {
        setLoading(true);
        try {
            const data = await apiClient.get<DashboardWithWidgets>(`/dashboards/${dashboard.id}`);
            setActiveDashboard(data);
            setWidgets(data.widgets || []);
        } catch (err: any) {
            setError(err.message || 'Failed to load dashboard');
        } finally {
            setLoading(false);
        }
    };

    if (authLoading || initialLoad) {
        return (
            <MainLayout>
                <div className="flex items-center justify-center h-[60vh]">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                        <p className="text-slate-500 dark:text-slate-400">Loading dashboard...</p>
                    </div>
                </div>
            </MainLayout>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return (
        <MainLayout>
            <div className="space-y-6">
                {/* Dashboard Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                            {activeDashboard?.title || 'My Dashboard'}
                        </h1>
                        {activeDashboard?.description && (
                            <p className="text-slate-500 dark:text-slate-400 mt-1">
                                {activeDashboard.description}
                            </p>
                        )}
                    </div>
                    
                    <DashboardSelector
                        dashboards={dashboards}
                        activeDashboard={activeDashboard}
                        onSelect={handleDashboardSelect}
                    />
                </div>

                {/* Dashboard Content */}
                {isLoading ? (
                    <div className="flex items-center justify-center h-[40vh]">
                        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                    </div>
                ) : activeDashboard ? (
                    <DashboardView
                        dashboard={activeDashboard}
                        widgets={widgets}
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center h-[40vh] text-center">
                        <div className="text-6xl mb-4">📊</div>
                        <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">
                            No dashboards yet
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 mb-6">
                            Create your first dashboard to start visualizing your data
                        </p>
                        <button className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/25">
                            Create Dashboard
                        </button>
                    </div>
                )}
            </div>
        </MainLayout>
    );
}
