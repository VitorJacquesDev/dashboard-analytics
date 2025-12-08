'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/app/components/layout/MainLayout';
import { useAuthStore } from '@/store/useAuthStore';
import { apiClient } from '@/lib/api-client';

interface Schedule {
    id: string;
    name: string;
    cronExpr: string;
    dashboardId: string;
    format: string[];
    recipients: string[];
    isActive: boolean;
    lastRun: string | null;
    nextRun: string;
}

export default function ReportsPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading: authLoading } = useAuthStore();
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, authLoading, router]);

    useEffect(() => {
        if (isAuthenticated) {
            loadSchedules();
        }
    }, [isAuthenticated]);

    const loadSchedules = async () => {
        try {
            setLoading(true);
            const data = await apiClient.get<Schedule[]>('/schedules');
            setSchedules(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load schedules');
        } finally {
            setLoading(false);
        }
    };

    const toggleSchedule = async (id: string, isActive: boolean) => {
        try {
            await apiClient.put(`/schedules/${id}`, { isActive: !isActive });
            setSchedules(schedules.map(s => 
                s.id === id ? { ...s, isActive: !isActive } : s
            ));
        } catch (err: any) {
            setError(err.message || 'Failed to update schedule');
        }
    };

    const formatCron = (cron: string) => {
        const parts = cron.split(' ');
        const minute = parts[0];
        const hour = parts[1];
        const dayOfMonth = parts[2];
        const dayOfWeek = parts[4];
        
        // Weekly on specific day
        if (dayOfWeek !== '*' && dayOfMonth === '*') {
            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            return `Weekly (${days[parseInt(dayOfWeek)] || dayOfWeek}) at ${hour}:${minute.padStart(2, '0')}`;
        }
        
        // Monthly on specific day
        if (dayOfMonth !== '*') {
            const suffix = dayOfMonth === '1' ? 'st' : dayOfMonth === '2' ? 'nd' : dayOfMonth === '3' ? 'rd' : 'th';
            return `Monthly (${dayOfMonth}${suffix}) at ${hour}:${minute.padStart(2, '0')}`;
        }
        
        // Daily
        if (dayOfMonth === '*' && dayOfWeek === '*') {
            return `Daily at ${hour}:${minute.padStart(2, '0')}`;
        }
        
        return `At ${hour}:${minute.padStart(2, '0')}`;
    };

    const formatDate = (date: string | null) => {
        if (!date) return 'Never';
        return new Date(date).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (authLoading) {
        return (
            <MainLayout>
                <div className="flex items-center justify-center h-[60vh]">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                        <p className="text-slate-500 dark:text-slate-400">Loading...</p>
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
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                        Scheduled Reports
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">
                        Manage your automated report schedules
                    </p>
                </div>
                <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2">
                    <span>+</span>
                    <span>New Schedule</span>
                </button>
            </div>

            {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
            ) : schedules.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="text-4xl mb-4">📅</div>
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                        No scheduled reports
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400">
                        Create your first automated report schedule
                    </p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {schedules.map((schedule) => (
                        <div
                            key={schedule.id}
                            className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg transition-shadow"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                            {schedule.name}
                                        </h3>
                                        <span className={`px-2 py-1 text-xs rounded-full ${
                                            schedule.isActive 
                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                                        }`}>
                                            {schedule.isActive ? 'Active' : 'Paused'}
                                        </span>
                                    </div>
                                    
                                    <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                        <div>
                                            <span className="text-slate-500 dark:text-slate-400">Frequency</span>
                                            <p className="text-slate-900 dark:text-white font-medium">
                                                {formatCron(schedule.cronExpr)}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-slate-500 dark:text-slate-400">Format</span>
                                            <p className="text-slate-900 dark:text-white font-medium">
                                                {schedule.format.join(', ')}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-slate-500 dark:text-slate-400">Last Run</span>
                                            <p className="text-slate-900 dark:text-white font-medium">
                                                {formatDate(schedule.lastRun)}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-slate-500 dark:text-slate-400">Next Run</span>
                                            <p className="text-slate-900 dark:text-white font-medium">
                                                {formatDate(schedule.nextRun)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-3">
                                        <span className="text-slate-500 dark:text-slate-400 text-sm">Recipients: </span>
                                        <span className="text-slate-700 dark:text-slate-300 text-sm">
                                            {schedule.recipients.join(', ')}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => toggleSchedule(schedule.id, schedule.isActive)}
                                        className={`p-2 rounded-lg transition-colors ${
                                            schedule.isActive
                                                ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                                                : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                                        }`}
                                        title={schedule.isActive ? 'Pause' : 'Activate'}
                                    >
                                        {schedule.isActive ? '⏸️' : '▶️'}
                                    </button>
                                    <button
                                        className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                        title="Edit"
                                    >
                                        ✏️
                                    </button>
                                    <button
                                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                        title="Delete"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            </div>
        </MainLayout>
    );
}
