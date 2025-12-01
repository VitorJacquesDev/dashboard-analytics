'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

interface Share {
    id: string;
    dashboardId: string;
    userId: string;
    permission: 'VIEW' | 'EDIT';
    createdAt: string;
    user: {
        id: string;
        name: string;
        email: string;
    };
}

interface ShareModalProps {
    dashboardId: string;
    dashboardTitle: string;
    isOpen: boolean;
    onClose: () => void;
}

export function ShareModal({ dashboardId, dashboardTitle, isOpen, onClose }: ShareModalProps) {
    const [shares, setShares] = useState<Share[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Form state
    const [email, setEmail] = useState('');
    const [permission, setPermission] = useState<'VIEW' | 'EDIT'>('VIEW');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch shares
    useEffect(() => {
        if (isOpen) {
            fetchShares();
        }
    }, [isOpen, dashboardId]);

    const fetchShares = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await apiClient.get<Share[]>(`/dashboards/${dashboardId}/share`);
            setShares(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleShare = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setIsSubmitting(true);

        try {
            await apiClient.post(`/dashboards/${dashboardId}/share`, {
                email,
                permission,
            });
            setSuccess(`Dashboard shared with ${email}`);
            setEmail('');
            fetchShares();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRevoke = async (userId: string, userName: string) => {
        if (!confirm(`Remove ${userName}'s access to this dashboard?`)) return;

        setError(null);
        try {
            await apiClient.delete(`/dashboards/${dashboardId}/share?userId=${userId}`);
            setSuccess(`Access revoked for ${userName}`);
            fetchShares();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleUpdatePermission = async (userId: string, newPermission: 'VIEW' | 'EDIT') => {
        try {
            await apiClient.post(`/dashboards/${dashboardId}/share`, {
                userId,
                permission: newPermission,
            });
            fetchShares();
        } catch (err: any) {
            setError(err.message);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-gray-200">
                            🔗 Share Dashboard
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            {dashboardTitle}
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
                <div className="p-6">
                    {/* Messages */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-sm">
                            {success}
                        </div>
                    )}

                    {/* Share Form */}
                    <form onSubmit={handleShare} className="mb-6">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Invite by email
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="colleague@company.com"
                                className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 text-sm"
                                required
                            />
                            <select
                                value={permission}
                                onChange={e => setPermission(e.target.value as 'VIEW' | 'EDIT')}
                                className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 text-sm"
                            >
                                <option value="VIEW">Can view</option>
                                <option value="EDIT">Can edit</option>
                            </select>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                            >
                                {isSubmitting ? '...' : 'Share'}
                            </button>
                        </div>
                    </form>

                    {/* Shared With List */}
                    <div>
                        <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                            People with access
                        </h3>
                        
                        {isLoading ? (
                            <div className="flex justify-center py-4">
                                <div className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                            </div>
                        ) : shares.length === 0 ? (
                            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                                Not shared with anyone yet
                            </p>
                        ) : (
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {shares.map(share => (
                                    <div
                                        key={share.id}
                                        className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
                                                {share.user.name[0]}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-900 dark:text-gray-200">
                                                    {share.user.name}
                                                </p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                    {share.user.email}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <select
                                                value={share.permission}
                                                onChange={e => handleUpdatePermission(share.userId, e.target.value as 'VIEW' | 'EDIT')}
                                                className="text-xs px-2 py-1 border border-slate-200 dark:border-slate-600 rounded dark:bg-slate-800"
                                            >
                                                <option value="VIEW">Can view</option>
                                                <option value="EDIT">Can edit</option>
                                            </select>
                                            <button
                                                onClick={() => handleRevoke(share.userId, share.user.name)}
                                                className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                                title="Remove access"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                    <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                        Users with access can view or edit based on their permission level
                    </p>
                </div>
            </div>
        </div>
    );
}
