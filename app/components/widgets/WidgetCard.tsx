'use client';

import { ReactNode, useState, useRef, useEffect } from 'react';
import { exportWidgetToPNG } from '@/lib/exportUtils';

interface WidgetCardProps {
    title: string;
    children: ReactNode;
    className?: string;
    widgetId?: string;
    onRemove?: () => void;
    onEdit?: () => void;
}

export function WidgetCard({ title, children, className = '', widgetId, onRemove, onEdit }: WidgetCardProps) {
    const [showMenu, setShowMenu] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleExportPNG = async () => {
        if (!widgetId) return;
        setIsExporting(true);
        try {
            await exportWidgetToPNG(widgetId, `widget-${title.replace(/\s+/g, '-').toLowerCase()}`);
        } catch (error) {
            console.error('Export failed:', error);
        } finally {
            setIsExporting(false);
            setShowMenu(false);
        }
    };

    return (
        <div 
            className={`bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-black/40 border border-slate-200/60 dark:border-slate-800/60 flex flex-col h-full transition-all duration-300 hover:shadow-2xl hover:shadow-slate-200/80 dark:hover:shadow-black/60 hover:-translate-y-1 ${className}`}
            data-widget-id={widgetId}
            id={widgetId ? `widget-${widgetId}` : undefined}
        >
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30 backdrop-blur-sm rounded-t-2xl">
                <h3 className="font-bold text-slate-800 dark:text-white truncate tracking-tight">
                    {title}
                </h3>
                <div className="flex items-center space-x-2">
                    {/* More options menu */}
                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                            aria-label="More options"
                        >
                            ⋮
                        </button>
                        {showMenu && (
                            <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                                <button
                                    onClick={handleExportPNG}
                                    disabled={isExporting || !widgetId}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50"
                                >
                                    {isExporting ? (
                                        <span className="w-4 h-4 border-2 border-slate-300 border-t-indigo-600 rounded-full animate-spin" />
                                    ) : (
                                        <span>🖼️</span>
                                    )}
                                    Export as PNG
                                </button>
                                {onEdit && (
                                    <button
                                        onClick={() => { onEdit(); setShowMenu(false); }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                                    >
                                        <span>✏️</span>
                                        Edit Widget
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
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
