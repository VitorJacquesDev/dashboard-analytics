'use client';

import { ReactNode } from 'react';

interface WidgetCardProps {
    title: string;
    children: ReactNode;
    className?: string;
    onRemove?: () => void;
    onEdit?: () => void;
}

export function WidgetCard({ title, children, className = '', onRemove, onEdit }: WidgetCardProps) {
    return (
        <div className={`bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-black/40 border border-slate-200/60 dark:border-slate-800/60 flex flex-col h-full transition-all duration-300 hover:shadow-2xl hover:shadow-slate-200/80 dark:hover:shadow-black/60 hover:-translate-y-1 ${className}`}>
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30 backdrop-blur-sm rounded-t-2xl">
                <h3 className="font-bold text-slate-800 dark:text-white truncate tracking-tight">
                    {title}
                </h3>
                <div className="flex items-center space-x-2">
                    {onEdit && (
                        <button
                            onClick={onEdit}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all"
                            aria-label="Edit widget"
                        >
                            ✏️
                        </button>
                    )}
                    {onRemove && (
                        <button
                            onClick={onRemove}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                            aria-label="Remove widget"
                        >
                            ✕
                        </button>
                    )}
                </div>
            </div>
            <div className="flex-1 p-5 min-h-0 overflow-hidden">
                {children}
            </div>
        </div>
    );
}
