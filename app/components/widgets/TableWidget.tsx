'use client';

import { ChartData } from '@/lib/types';

interface TableWidgetProps {
    data: ChartData[];
}

export function TableWidget({ data }: TableWidgetProps) {
    if (!data || data.length === 0) {
        return <div className="p-4 text-center text-slate-500">No data available</div>;
    }

    // Extract headers from the first data item
    // We want 'x', 'y', and any other keys
    const headers = Object.keys(data[0]).filter(key => key !== 'id'); // Assuming 'id' might be internal, but let's keep it simple

    return (
        <div className="w-full h-full overflow-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                <thead className="bg-slate-50 dark:bg-slate-800">
                    <tr>
                        {headers.map(header => (
                            <th
                                key={header}
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider"
                            >
                                {header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-700">
                    {data.map((row, idx) => (
                        <tr key={idx}>
                            {headers.map(header => (
                                <td
                                    key={`${idx}-${header}`}
                                    className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100"
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
