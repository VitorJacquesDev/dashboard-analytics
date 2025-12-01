'use client';

import { useState, useRef, useEffect } from 'react';
import { exportToPDF, exportToPNG, exportToXLSX, exportToCSV } from '@/lib/exportUtils';
import { Widget } from '@/lib/types';

interface ExportMenuProps {
    dashboardId: string;
    widgets: Widget[];
    dataMap?: Record<string, any[]>;
}

export function ExportMenu({ dashboardId, widgets, dataMap = {} }: ExportMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleExport = async (format: 'pdf' | 'png' | 'xlsx' | 'csv') => {
        setIsExporting(true);
        try {
            const elementId = `dashboard-${dashboardId}`;
            const fileName = `dashboard-export-${new Date().toISOString().split('T')[0]}`;

            switch (format) {
                case 'pdf':
                    await exportToPDF(elementId, fileName);
                    break;
                case 'png':
                    await exportToPNG(elementId, fileName);
                    break;
                case 'xlsx':
                    exportToXLSX(widgets, dataMap, fileName);
                    break;
                case 'csv':
                    // Export all data as single CSV
                    const allData = Object.values(dataMap).flat();
                    exportToCSV(allData, fileName);
                    break;
            }
        } catch (error) {
            console.error('Export failed:', error);
        } finally {
            setIsExporting(false);
            setIsOpen(false);
        }
    };

    const exportOptions = [
        { format: 'pdf' as const, label: 'PDF Document', icon: '📄', description: 'Best for printing' },
        { format: 'png' as const, label: 'PNG Image', icon: '🖼️', description: 'Best for sharing' },
        { format: 'xlsx' as const, label: 'Excel Spreadsheet', icon: '📊', description: 'Best for analysis' },
        { format: 'csv' as const, label: 'CSV File', icon: '📋', description: 'Universal format' },
    ];

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                disabled={isExporting}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm disabled:opacity-50"
            >
                {isExporting ? (
                    <>
                        <div className="w-4 h-4 border-2 border-slate-300 border-t-indigo-600 rounded-full animate-spin" />
                        <span>Exporting...</span>
                    </>
                ) : (
                    <>
                        <span>📥</span>
                        <span>Export</span>
                        <svg
                            className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl shadow-slate-200/50 dark:shadow-black/20 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-2 border-b border-slate-100 dark:border-slate-700">
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 px-2">
                            Export Dashboard
                        </p>
                    </div>
                    <div className="p-2">
                        {exportOptions.map((option) => (
                            <button
                                key={option.format}
                                onClick={() => handleExport(option.format)}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                            >
                                <span className="text-lg">{option.icon}</span>
                                <div>
                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        {option.label}
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {option.description}
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
