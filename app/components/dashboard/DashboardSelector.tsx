'use client';

import { useState, useRef, useEffect } from 'react';
import { Dashboard } from '@/lib/types';

interface DashboardSelectorProps {
    dashboards: Dashboard[];
    activeDashboard: Dashboard | null;
    onSelect: (dashboard: Dashboard) => void;
}

export function DashboardSelector({ dashboards, activeDashboard, onSelect }: DashboardSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Close on escape key
    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, []);

    if (dashboards.length <= 1) {
        return null;
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
                aria-expanded={isOpen}
                aria-haspopup="listbox"
            >
                <span className="text-indigo-500">📊</span>
                <span className="max-w-[150px] truncate">
                    {activeDashboard?.title || 'Select Dashboard'}
                </span>
                <svg
                    className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <div 
                    className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl shadow-slate-200/50 dark:shadow-black/20 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
                    role="listbox"
                >
                    <div className="p-2 border-b border-slate-100 dark:border-slate-700">
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 px-2">
                            Your Dashboards ({dashboards.length})
                        </p>
                    </div>
                    <div className="max-h-64 overflow-y-auto p-2">
                        {dashboards.map((dashboard) => {
                            const isActive = activeDashboard?.id === dashboard.id;
                            return (
                                <button
                                    key={dashboard.id}
                                    onClick={() => {
                                        onSelect(dashboard);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                                        isActive
                                            ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                                    }`}
                                    role="option"
                                    aria-selected={isActive}
                                >
                                    <span className={`text-lg ${isActive ? 'scale-110' : ''} transition-transform`}>
                                        📊
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">
                                            {dashboard.title}
                                        </p>
                                        {dashboard.description && (
                                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                                {dashboard.description}
                                            </p>
                                        )}
                                    </div>
                                    {isActive && (
                                        <svg className="w-4 h-4 text-indigo-600 dark:text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
