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
        <div className="bg-white dark:bg-slate-900 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 mb-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">Filters</h3>
                <div className="space-x-2">
                    {activeFilters.length > 0 && (
                        <button
                            onClick={clearFilters}
                            className="text-xs text-red-600 hover:text-red-700 dark:text-red-400"
                        >
                            Clear All
                        </button>
                    )}
                    <button
                        onClick={() => setIsAdding(!isAdding)}
                        className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400"
                    >
                        + Add Filter
                    </button>
                </div>
            </div>

            {isAdding && (
                <div className="flex items-center gap-2 mb-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded border border-slate-200 dark:border-slate-700">
                    <select
                        value={field}
                        onChange={(e) => setField(e.target.value)}
                        className="text-sm rounded border-slate-300 dark:border-slate-600 dark:bg-slate-800"
                    >
                        <option value="category">Category</option>
                        <option value="status">Status</option>
                        <option value="date">Date</option>
                        <option value="revenue">Revenue</option>
                    </select>
                    <select
                        value={operator}
                        onChange={(e) => setOperator(e.target.value as any)}
                        className="text-sm rounded border-slate-300 dark:border-slate-600 dark:bg-slate-800"
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
                        className="text-sm rounded border-slate-300 dark:border-slate-600 dark:bg-slate-800"
                    />
                    <button
                        onClick={handleAddFilter}
                        className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                    >
                        Apply
                    </button>
                </div>
            )}

            <div className="flex flex-wrap gap-2">
                {activeFilters.length === 0 && !isAdding && (
                    <span className="text-sm text-slate-400 italic">No active filters</span>
                )}
                {activeFilters.map((filter) => (
                    <div
                        key={filter.id}
                        className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-sm border border-blue-100 dark:border-blue-800"
                    >
                        <span>{filter.label}</span>
                        <button
                            onClick={() => removeFilter(filter.id)}
                            className="hover:text-blue-900 dark:hover:text-blue-100"
                        >
                            ×
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
