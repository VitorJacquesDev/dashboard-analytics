'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { WidgetType, type Widget } from '@/lib/types';
import {
  PRISMA_DASHBOARD_WIDGET_DATA_SOURCE_CATALOG,
  type PrismaDashboardWidgetDataSourceConfigMode,
  type PrismaDashboardWidgetDataSourceId,
} from '@/lib/prisma-dashboard-widget-data-sources';

type WidgetTypeValue = (typeof WidgetType)[keyof typeof WidgetType];
type WidgetPresetKey = PrismaDashboardWidgetDataSourceId | 'custom';

interface WidgetCreateModalProps {
  dashboardId: string;
  isOpen: boolean;
  onClose: () => void;
  onCreated: (widget: Widget) => void;
}

type WidgetPreset = {
  key: WidgetPresetKey;
  label: string;
  description: string;
  defaultTitle: string;
  dataSource: string;
  defaultType: WidgetTypeValue;
  allowedTypes: readonly WidgetTypeValue[];
  configMode: PrismaDashboardWidgetDataSourceConfigMode | 'custom-json';
};

const ALL_WIDGET_TYPES = Object.values(WidgetType) as WidgetTypeValue[];

const PRESETS: WidgetPreset[] = [
  ...PRISMA_DASHBOARD_WIDGET_DATA_SOURCE_CATALOG.map((preset) => ({
    key: preset.dataSource,
    ...preset,
  })),
  {
    key: 'custom',
    label: 'Custom · Data Source Manual',
    description: 'Permite informar dataSource e config JSON manualmente',
    defaultTitle: 'Novo Widget',
    dataSource: '',
    defaultType: WidgetType.LINE_CHART,
    allowedTypes: ALL_WIDGET_TYPES,
    configMode: 'custom-json',
  },
];

const PRESET_MAP = new Map(PRESETS.map((preset) => [preset.key, preset]));
const DEFAULT_PRESET_KEY: WidgetPresetKey = 'prisma:dashboard.widgets.count';

function safeParseJsonObject(input: string): Record<string, unknown> {
  const trimmed = input.trim();
  if (!trimmed) {
    return {};
  }

  const parsed = JSON.parse(trimmed) as unknown;
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Config JSON must be an object');
  }

  return parsed as Record<string, unknown>;
}

export function WidgetCreateModal({
  dashboardId,
  isOpen,
  onClose,
  onCreated,
}: WidgetCreateModalProps) {
  const [presetKey, setPresetKey] = useState<WidgetPresetKey>(DEFAULT_PRESET_KEY);
  const [title, setTitle] = useState(PRESET_MAP.get(DEFAULT_PRESET_KEY)?.defaultTitle ?? 'Novo Widget');
  const [dataSource, setDataSource] = useState(PRESET_MAP.get(DEFAULT_PRESET_KEY)?.dataSource ?? '');
  const [type, setType] = useState<WidgetTypeValue>(WidgetType.METRIC);
  const [timelineDays, setTimelineDays] = useState<number>(14);
  const [upcomingLimit, setUpcomingLimit] = useState<number>(10);
  const [includeInactiveSchedules, setIncludeInactiveSchedules] = useState(false);
  const [customConfigJson, setCustomConfigJson] = useState('{}');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedPreset = useMemo(
    () => PRESET_MAP.get(presetKey) ?? PRESET_MAP.get(DEFAULT_PRESET_KEY)!,
    [presetKey]
  );

  const allowedTypes = selectedPreset.allowedTypes;

  const resetForm = () => {
    const defaultPreset = PRESET_MAP.get(DEFAULT_PRESET_KEY)!;
    setPresetKey(DEFAULT_PRESET_KEY);
    setTitle(defaultPreset.defaultTitle);
    setDataSource(defaultPreset.dataSource);
    setType(defaultPreset.defaultType);
    setTimelineDays(14);
    setUpcomingLimit(10);
    setIncludeInactiveSchedules(false);
    setCustomConfigJson('{}');
    setError(null);
    setIsSubmitting(false);
  };

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    resetForm();
  }, [isOpen]);

  useEffect(() => {
    setTitle(selectedPreset.defaultTitle);
    setDataSource(selectedPreset.dataSource);
    setType(selectedPreset.defaultType);

    if (selectedPreset.configMode === 'timeline') {
      setTimelineDays(14);
    }
    if (selectedPreset.configMode === 'upcoming') {
      setUpcomingLimit(10);
      setIncludeInactiveSchedules(false);
    }
    if (selectedPreset.configMode === 'custom-json') {
      setCustomConfigJson('{}');
    }
  }, [selectedPreset]);

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  const buildConfig = (): Record<string, unknown> => {
    switch (selectedPreset.configMode) {
      case 'timeline':
        return { days: timelineDays };
      case 'upcoming':
        return { limit: upcomingLimit, includeInactive: includeInactiveSchedules };
      case 'custom-json':
        return safeParseJsonObject(customConfigJson);
      case 'none':
      default:
        return {};
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Título do widget é obrigatório');
      return;
    }

    const trimmedDataSource = dataSource.trim();
    if (!trimmedDataSource) {
      setError('Data source é obrigatório');
      return;
    }

    if (!allowedTypes.includes(type)) {
      setError('Tipo de widget incompatível com a fonte selecionada');
      return;
    }

    let config: Record<string, unknown>;
    try {
      config = buildConfig();
    } catch (err: any) {
      setError(err.message ?? 'Config JSON inválido');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await apiClient.post<Widget>('/widgets', {
        dashboardId,
        title: trimmedTitle,
        type,
        dataSource: trimmedDataSource,
        config,
      });
      onCreated(created);
      resetForm();
      onClose();
    } catch (err: any) {
      setError(err.message ?? 'Falha ao criar widget');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Adicionar Widget</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Selecione uma fonte real (`prisma:dashboard.*`) ou use dataSource manual.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Fechar modal de criação de widget"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 px-3 py-2 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Preset de Fonte
            </label>
            <select
              value={presetKey}
              onChange={(e) => setPresetKey(e.target.value as WidgetPresetKey)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-800"
            >
              {PRESETS.map((preset) => (
                <option key={preset.key} value={preset.key}>
                  {preset.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{selectedPreset.description}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Título
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-800"
                placeholder="Nome do widget"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Tipo do Widget
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as WidgetTypeValue)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-800"
              >
                {allowedTypes.map((widgetType) => (
                  <option key={widgetType} value={widgetType}>
                    {widgetType}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Data Source
            </label>
            <input
              type="text"
              value={dataSource}
              onChange={(e) => setDataSource(e.target.value)}
              disabled={selectedPreset.key !== 'custom'}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-800 disabled:opacity-70"
              placeholder="ex.: prisma:dashboard.widgets.count"
              required
            />
          </div>

          {selectedPreset.configMode === 'timeline' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Janela (dias)
                </label>
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={timelineDays}
                  onChange={(e) => setTimelineDays(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-800"
                />
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Usado por `prisma:dashboard.widgets.timeline` (1-365).
                </p>
              </div>
            </div>
          )}

          {selectedPreset.configMode === 'upcoming' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Limite de linhas
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={upcomingLimit}
                  onChange={(e) => setUpcomingLimit(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-800"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 md:pt-7">
                <input
                  type="checkbox"
                  checked={includeInactiveSchedules}
                  onChange={(e) => setIncludeInactiveSchedules(e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-600"
                />
                Incluir agendamentos inativos
              </label>
            </div>
          )}

          {selectedPreset.configMode === 'custom-json' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Config JSON
              </label>
              <textarea
                value={customConfigJson}
                onChange={(e) => setCustomConfigJson(e.target.value)}
                rows={6}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-800 font-mono text-sm"
                placeholder='{"days":14}'
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors"
            >
              {isSubmitting ? 'Criando...' : 'Criar Widget'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
