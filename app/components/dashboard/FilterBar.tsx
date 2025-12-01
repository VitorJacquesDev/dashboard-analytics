'use client';

import { useState } from 'react';
import { useDashboardStore } from '@/store/useDashboardStore';
import { ActiveFilter } from '@/lib/types';

export function FilterBar() {
    const { activeFilters, addFilter, removeFilter, clearFilters } = useDashboardStore();
    const [isAdding, setIsAdding] = useState(false);
    const [field, setField] = useState('category');
    const [operator, setOperator] = useState<ActiveFilter['operator']>('eq');
    const [value, setValue] = useState('');

    const handleAddFilter = () => {
        if (!value) return;

        const newFilter: ActiveFilter = {
            id: Math.random().toString(36).substr(2, 9),
            field,
            operator,
            value,
            label: `${field} ${operator} ${value}`,
        };

        addFilter(newFilter);
        setIsAdding(false);
        setValue('');
    };

    return (
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-lg shadow-slate-200/50 dark:shadow-black/20 border border-slate-200/60 dark:border-slate-800/60 mb-8 transition-all duration-300">
            <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-bold text-slate-800 dark:text-gray-200 flex items-center gap-2">
                    <span className="text-indigo-500">🔍</span> Filters
                </h3>
                <div className="space-x-3">
                    {activeFilters.length > 0 && (
                        <button
                            onClick={clearFilters}
                            className="text-xs font-medium text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 px-3 py-1.5 rounded-lg transition-colors"
                        >
                            Clear All
                        </button>
                    )}
                    <button
                        onClick={() => setIsAdding(!isAdding)}
                        className={`text-xs font-semibold px-4 py-2 rounded-lg transition-all duration-200 ${isAdding
                                ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                                : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50'
                            }`}
                    >
                        {isAdding ? 'Cancel' : '+ Add Filter'}
                    </button>
                </div>
            </div>

            {isAdding && (
                <div className="flex flex-wrap items-center gap-3 mb-5 p-4 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl border border-slate-200/60 dark:border-slate-700/60 backdrop-blur-sm animate-in fade-in slide-in-from-top-2 duration-200">
                    <select
                        value={field}
                        onChange={(e) => setField(e.target.value)}
                        className="text-sm rounded-lg border-slate-300 dark:border-slate-600 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 py-2 px-3"
                    >
                        <option value="category">Category</option>
                        <option value="status">Status</option>
                        <option value="date">Date</option>
                        <option value="revenue">Revenue</option>
                    </select>
                    <select
                        value={operator}
                        onChange={(e) => setOperator(e.target.value as any)}
                        className="text-sm rounded-lg border-slate-300 dark:border-slate-600 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 py-2 px-3"
                    >
                        <option value="eq">Equals</option>
                        <option value="contains">Contains</option>
                        <option value="gt">Greater than</option>
                        <option value="lt">Less than</option>
                    </select>
                    <input
                        type="text"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        placeholder="Value"
                        className="text-sm rounded-lg border-slate-300 dark:border-slate-600 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 py-2 px-3 flex-1 min-w-[200px]"
                    />
                    <button
                        onClick={handleAddFilter}
                        className="text-sm font-medium bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 transition-all hover:-translate-y-0.5"
                    >
                        Apply Filter
                    </button>
                </div>
            )}

            <div className="flex flex-wrap gap-2">
                {activeFilters.length === 0 && !isAdding && (
                    <span className="text-sm text-slate-400 italic py-2">No active filters applied</span>
                )}
                {activeFilters.map((filter) => (
                    <div
                        key={filter.id}
                        className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 px-3 py-1.5 rounded-full text-sm border border-indigo-100 dark:border-indigo-800/50 shadow-sm animate-in zoom-in duration-200"
                    >
                        <span className="font-medium">{filter.label}</span>
                        <button
                            onClick={() => removeFilter(filter.id)}
                            className="hover:text-indigo-900 dark:hover:text-indigo-100 p-0.5 rounded-full hover:bg-indigo-200/50 dark:hover:bg-indigo-800/50 transition-colors"
                        >
                            ×
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
