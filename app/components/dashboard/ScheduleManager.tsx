'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { Dashboard } from '@/lib/types';

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
    createdAt: string;
}

interface ScheduleManagerProps {
    dashboards: Dashboard[];
    isOpen: boolean;
    onClose: () => void;
}

const FREQUENCY_OPTIONS = [
    { label: 'Daily at 9 AM', value: '0 9 * * *' },
    { label: 'Daily at 6 PM', value: '0 18 * * *' },
    { label: 'Weekly (Monday 9 AM)', value: '0 9 * * 1' },
    { label: 'Weekly (Friday 5 PM)', value: '0 17 * * 5' },
    { label: 'Monthly (1st at 9 AM)', value: '0 9 1 * *' },
    { label: 'Monthly (15th at 9 AM)', value: '0 9 15 * *' },
];

export function ScheduleManager({ dashboards, isOpen, onClose }: ScheduleManagerProps) {
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        dashboardId: '',
        cronExpr: '0 9 * * *',
        recipients: '',
        format: ['PDF'],
    });

    // Fetch schedules
    useEffect(() => {
        if (isOpen) {
            fetchSchedules();
        }
    }, [isOpen]);

    const fetchSchedules = async () => {
        setIsLoading(true);
        try {
            const data = await apiClient.get<Schedule[]>('/schedules');
            setSchedules(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        try {
            const recipients = formData.recipients
                .split(',')
                .map(email => email.trim())
                .filter(email => email);

            if (recipients.length === 0) {
                setError('At least one recipient email is required');
                return;
            }

            await apiClient.post('/schedules', {
                name: formData.name,
                dashboardId: formData.dashboardId,
                cronExpr: formData.cronExpr,
                recipients,
                format: formData.format,
            });

            // Reset form and refresh
            setFormData({
                name: '',
                dashboardId: '',
                cronExpr: '0 9 * * *',
                recipients: '',
                format: ['PDF'],
            });
            setIsCreating(false);
            fetchSchedules();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleToggle = async (id: string) => {
        try {
            await apiClient.post(`/schedules/${id}/toggle`, {});
            fetchSchedules();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this schedule?')) return;

        try {
            await apiClient.delete(`/schedules/${id}`);
            fetchSchedules();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return 'Never';
        return new Date(dateStr).toLocaleString();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            📅 Scheduled Reports
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Automate report delivery to your inbox
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {/* Create Form */}
                    {isCreating ? (
                        <form onSubmit={handleCreate} className="mb-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
                                New Schedule
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Name
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-800"
                                        placeholder="Weekly Sales Report"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Dashboard
                                    </label>
                                    <select
                                        value={formData.dashboardId}
                                        onChange={e => setFormData({ ...formData, dashboardId: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-800"
                                        required
                                    >
                                        <option value="">Select dashboard...</option>
                                        {dashboards.map(d => (
                                            <option key={d.id} value={d.id}>{d.title}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Frequency
                                    </label>
                                    <select
                                        value={formData.cronExpr}
                                        onChange={e => setFormData({ ...formData, cronExpr: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-800"
                                    >
                                        {FREQUENCY_OPTIONS.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Recipients (comma-separated)
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.recipients}
                                        onChange={e => setFormData({ ...formData, recipients: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-800"
                                        placeholder="email@example.com, other@example.com"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsCreating(false)}
                                    className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                                >
                                    Create Schedule
                                </button>
                            </div>
                        </form>
                    ) : (
                        <button
                            onClick={() => setIsCreating(true)}
                            className="mb-6 w-full p-4 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-slate-500 dark:text-slate-400 hover:border-indigo-500 hover:text-indigo-500 transition-colors"
                        >
                            + Create New Schedule
                        </button>
                    )}

                    {/* Schedules List */}
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                        </div>
                    ) : schedules.length === 0 ? (
                        <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                            <div className="text-4xl mb-2">📭</div>
                            <p>No scheduled reports yet</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {schedules.map(schedule => (
                                <div
                                    key={schedule.id}
                                    className={`p-4 rounded-xl border ${
                                        schedule.isActive
                                            ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                                            : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 opacity-60'
                                    }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-semibold text-slate-900 dark:text-white">
                                                    {schedule.name}
                                                </h4>
                                                <span className={`px-2 py-0.5 text-xs rounded-full ${
                                                    schedule.isActive
                                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                        : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                                                }`}>
                                                    {schedule.isActive ? 'Active' : 'Paused'}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                                {FREQUENCY_OPTIONS.find(o => o.value === schedule.cronExpr)?.label || schedule.cronExpr}
                                            </p>
                                            <div className="flex gap-4 mt-2 text-xs text-slate-500 dark:text-slate-400">
                                                <span>Last run: {formatDate(schedule.lastRun)}</span>
                                                <span>Next run: {formatDate(schedule.nextRun)}</span>
                                            </div>
                                            <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                                Recipients: {schedule.recipients.join(', ')}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleToggle(schedule.id)}
                                                className={`p-2 rounded-lg transition-colors ${
                                                    schedule.isActive
                                                        ? 'hover:bg-amber-50 text-amber-600 dark:hover:bg-amber-900/20'
                                                        : 'hover:bg-emerald-50 text-emerald-600 dark:hover:bg-emerald-900/20'
                                                }`}
                                                title={schedule.isActive ? 'Pause' : 'Resume'}
                                            >
                                                {schedule.isActive ? '⏸️' : '▶️'}
                                            </button>
                                            <button
                                                onClick={() => handleDelete(schedule.id)}
                                                className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 rounded-lg transition-colors"
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

                {/* Footer */}
                <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                    <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                        Reports are sent as PDF attachments to the specified email addresses
                    </p>
                </div>
            </div>
        </div>
    );
}
