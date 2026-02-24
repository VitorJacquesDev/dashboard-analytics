'use client';

import { useEffect, useMemo, useState } from 'react';
import { useDashboardStore } from '@/store/useDashboardStore';
import { ActiveFilter, Widget } from '@/lib/types';
import {
    FILTER_OPERATOR_LABELS,
    getFilterCatalogForWidgets,
} from '@/lib/widget-filter-catalog';

interface FilterBarProps {
    widgets?: Widget[];
}

export function FilterBar({ widgets = [] }: FilterBarProps) {
    const { activeFilters, addFilter, removeFilter, clearFilters } = useDashboardStore();
    const filterCatalog = useMemo(() => getFilterCatalogForWidgets(widgets), [widgets]);
    const availableFields = filterCatalog.fields;

    const [isAdding, setIsAdding] = useState(false);
    const [field, setField] = useState('');
    const [operator, setOperator] = useState<ActiveFilter['operator']>('eq');
    const [value, setValue] = useState('');

    const selectedField = availableFields.find((item) => item.field === field) ?? null;
    const availableOperators = selectedField?.operators ?? [];

    useEffect(() => {
        if (availableFields.length === 0) {
            if (field !== '') setField('');
            return;
        }

        const isCurrentFieldSupported = availableFields.some((item) => item.field === field);
        if (!isCurrentFieldSupported) {
            setField(availableFields[0].field);
        }
    }, [availableFields, field]);

    useEffect(() => {
        if (!selectedField || selectedField.operators.length === 0) {
            return;
        }

        if (!selectedField.operators.includes(operator)) {
            setOperator(selectedField.operators[0]);
        }
    }, [selectedField, operator]);

    const handleAddFilter = () => {
        const trimmedValue = value.trim();
        if (!trimmedValue || !selectedField || availableOperators.length === 0) return;

        const newFilter: ActiveFilter = {
            id: Math.random().toString(36).slice(2, 11),
            field: selectedField.field,
            operator,
            value: trimmedValue,
            label: `${selectedField.label} ${FILTER_OPERATOR_LABELS[operator]} ${trimmedValue}`,
        };

        addFilter(newFilter);
        setIsAdding(false);
        setValue('');
    };

    const canAddFilter = availableFields.length > 0;
    const selectedFieldCoverageText = selectedField
        ? `${selectedField.supportedWidgetCount}/${Math.max(filterCatalog.totalWidgets, 1)} widgets`
        : null;

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
                        onClick={() => setIsAdding((prev) => (canAddFilter ? !prev : prev))}
                        disabled={!canAddFilter}
                        className={`text-xs font-semibold px-4 py-2 rounded-lg transition-all duration-200 ${isAdding
                                ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                                : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50'
                            } disabled:opacity-60 disabled:cursor-not-allowed`}
                    >
                        {isAdding ? 'Cancel' : '+ Add Filter'}
                    </button>
                </div>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                {filterCatalog.totalWidgets === 0
                    ? 'Add widgets to enable contextual filters.'
                    : (
                        <>
                            Fields and operators are based on the current widgets data sources.
                            {filterCatalog.unsupportedWidgets > 0 &&
                                ` ${filterCatalog.unsupportedWidgets} widget(s) do not expose filter contracts yet.`}
                        </>
                    )}
            </p>

            {isAdding && (
                <>
                    {canAddFilter ? (
                        <div className="mb-5 p-4 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl border border-slate-200/60 dark:border-slate-700/60 backdrop-blur-sm animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="flex flex-wrap items-center gap-3">
                                <select
                                    value={field}
                                    onChange={(e) => setField(e.target.value)}
                                    className="text-sm rounded-lg border-slate-300 dark:border-slate-600 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 py-2 px-3"
                                >
                                    {availableFields.map((fieldOption) => (
                                        <option key={fieldOption.field} value={fieldOption.field}>
                                            {fieldOption.label}
                                            {fieldOption.supportedWidgetCount < filterCatalog.totalWidgets
                                                ? ` (${fieldOption.supportedWidgetCount}/${filterCatalog.totalWidgets})`
                                                : ''}
                                        </option>
                                    ))}
                                </select>
                                <select
                                    value={operator}
                                    onChange={(e) =>
                                        setOperator(e.target.value as ActiveFilter['operator'])
                                    }
                                    className="text-sm rounded-lg border-slate-300 dark:border-slate-600 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 py-2 px-3"
                                >
                                    {availableOperators.map((operatorOption) => (
                                        <option key={operatorOption} value={operatorOption}>
                                            {FILTER_OPERATOR_LABELS[operatorOption]}
                                        </option>
                                    ))}
                                </select>
                                <input
                                    type="text"
                                    value={value}
                                    onChange={(e) => setValue(e.target.value)}
                                    placeholder={selectedField?.placeholder ?? 'Value'}
                                    className="text-sm rounded-lg border-slate-300 dark:border-slate-600 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 py-2 px-3 flex-1 min-w-[220px]"
                                />
                                <button
                                    onClick={handleAddFilter}
                                    disabled={!selectedField || !value.trim()}
                                    className="text-sm font-medium bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:bg-indigo-600 disabled:hover:translate-y-0"
                                >
                                    Apply Filter
                                </button>
                            </div>

                            {selectedField && (
                                <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 flex flex-wrap gap-x-4 gap-y-1">
                                    <span>{selectedField.description}</span>
                                    <span>
                                        Scope: {selectedField.domains.join(', ')} · {selectedFieldCoverageText}
                                    </span>
                                    {operator === 'in' && <span>Use comma-separated values.</span>}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="mb-5 p-4 rounded-xl border border-amber-200/70 dark:border-amber-700/60 bg-amber-50/70 dark:bg-amber-900/15 text-sm text-amber-800 dark:text-amber-300">
                            Current widgets do not expose supported filter contracts yet.
                        </div>
                    )}
                </>
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
