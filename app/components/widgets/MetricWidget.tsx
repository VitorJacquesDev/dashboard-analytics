'use client';

import { ChartData } from '@/lib/types';

interface MetricWidgetProps {
    data: ChartData[];
    title?: string;
}

export function MetricWidget({ data, title }: MetricWidgetProps) {
    // For a metric widget, we usually take the last value or the sum
    // Let's assume we take the last data point's Y value
    const lastPoint = data[data.length - 1];
    const value = lastPoint ? lastPoint.y : 0;
    const label = lastPoint ? lastPoint.x : '';

    // Calculate trend if we have at least 2 points
    let trend = 0;
    if (data.length >= 2) {
        const prev = data[data.length - 2].y as number;
        const curr = data[data.length - 1].y as number;
        if (prev !== 0) {
            trend = ((curr - prev) / prev) * 100;
        }
    }

    return (
        <div className="flex flex-col items-center justify-center h-full p-4">
            <div className="text-5xl font-extrabold bg-gradient-to-br from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent tracking-tight">
                {typeof value === 'number' ? value.toLocaleString() : value}
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400 mt-3 font-medium">
                {String(label)}
            </div>
            {trend !== 0 && (
                <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold mt-3 ${trend > 0
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                        : 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400'
                    }`}>
                    <span className="mr-1">{trend > 0 ? '↑' : '↓'}</span>
                    {Math.abs(trend).toFixed(1)}%
                </div>
            )}
        </div>
    );
}
