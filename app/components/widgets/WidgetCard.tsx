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
        <div className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col h-full ${className}`}>
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <h3 className="font-semibold text-slate-800 dark:text-white truncate">
                    {title}
                </h3>
                <div className="flex items-center space-x-2">
                    {onEdit && (
                        <button
                            onClick={onEdit}
                            className="p-1 text-slate-400 hover:text-blue-500 transition-colors"
                            aria-label="Edit widget"
                        >
                            ✏️
                        </button>
                    )}
                    {onRemove && (
                        <button
                            onClick={onRemove}
                            className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                            aria-label="Remove widget"
                        >
                            ✕
                        </button>
                    )}
                </div>
            </div>
            <div className="flex-1 p-4 min-h-0 overflow-hidden">
                {children}
            </div>
        </div>
    );
}
