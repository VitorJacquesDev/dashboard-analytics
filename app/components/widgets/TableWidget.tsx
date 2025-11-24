'use client';

import { ChartData } from '@/lib/types';

interface TableWidgetProps {
    data: ChartData[];
}

export function TableWidget({ data }: TableWidgetProps) {
    if (!data || data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center text-slate-500 dark:text-slate-400">
                <span className="text-4xl mb-2">📉</span>
                <p className="text-sm font-medium">No data available</p>
            </div>
        );
    }

    // Extract headers from the first data item
    const headers = Object.keys(data[0]).filter(key => key !== 'id');

    return (
        <div className="w-full h-full overflow-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800/60">
                <thead className="bg-slate-50/80 dark:bg-slate-800/50 backdrop-blur-sm sticky top-0 z-10">
                    <tr>
                        {headers.map(header => (
                            <th
                                key={header}
                                scope="col"
                                className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider"
                            >
                                {header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="bg-white/50 dark:bg-slate-900/20 divide-y divide-slate-100 dark:divide-slate-800/40">
                    {data.map((row, idx) => (
                        <tr
                            key={idx}
                            className="hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-colors duration-150"
                        >
                            {headers.map(header => (
                                <td
                                    key={`${idx}-${header}`}
                                    className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-700 dark:text-slate-200"
                                >
                                    {String(row[header] ?? '')}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
