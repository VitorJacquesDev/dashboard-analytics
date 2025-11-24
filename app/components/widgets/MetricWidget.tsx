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
            <div className="text-4xl font-bold text-slate-900 dark:text-white">
                {typeof value === 'number' ? value.toLocaleString() : value}
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                {String(label)}
            </div>
            {trend !== 0 && (
                <div className={`text-xs font-medium mt-2 ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {trend > 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}%
                </div>
            )}
        </div>
    );
}
