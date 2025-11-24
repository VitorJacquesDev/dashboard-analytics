import { create } from 'zustand';
import { Dashboard, Widget, ActiveFilter } from '@/lib/types';

interface DashboardState {
    dashboards: Dashboard[];
    activeDashboard: Dashboard | null;
    widgets: Widget[];
    activeFilters: ActiveFilter[];
    isLoading: boolean;
    error: string | null;

    // Actions
    setDashboards: (dashboards: Dashboard[]) => void;
    addDashboard: (dashboard: Dashboard) => void;
    updateDashboardInList: (dashboard: Dashboard) => void;
    removeDashboardFromList: (dashboardId: string) => void;

    setActiveDashboard: (dashboard: Dashboard | null) => void;

    setWidgets: (widgets: Widget[]) => void;
    addWidget: (widget: Widget) => void;
    updateWidget: (widget: Widget) => void;
    removeWidget: (widgetId: string) => void;

    addFilter: (filter: ActiveFilter) => void;
    removeFilter: (filterId: string) => void;
    clearFilters: () => void;

    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
    dashboards: [],
    activeDashboard: null,
    widgets: [],
    activeFilters: [],
    isLoading: false,
    error: null,

    setDashboards: (dashboards) => set({ dashboards }),
    addDashboard: (dashboard) => set((state) => ({ dashboards: [...state.dashboards, dashboard] })),
    updateDashboardInList: (dashboard) =>
        set((state) => ({
            dashboards: state.dashboards.map((d) => (d.id === dashboard.id ? dashboard : d)),
            activeDashboard: state.activeDashboard?.id === dashboard.id ? dashboard : state.activeDashboard,
        })),
    removeDashboardFromList: (dashboardId) =>
        set((state) => ({
            dashboards: state.dashboards.filter((d) => d.id !== dashboardId),
            activeDashboard: state.activeDashboard?.id === dashboardId ? null : state.activeDashboard,
        })),

    setActiveDashboard: (dashboard) => set({ activeDashboard: dashboard }),

    setWidgets: (widgets) => set({ widgets }),
    addWidget: (widget) => set((state) => ({ widgets: [...state.widgets, widget] })),
    updateWidget: (widget) =>
        set((state) => ({
            widgets: state.widgets.map((w) => (w.id === widget.id ? widget : w)),
        })),
    removeWidget: (widgetId) =>
        set((state) => ({
            widgets: state.widgets.filter((w) => w.id !== widgetId),
        })),

    addFilter: (filter) => set((state) => ({ activeFilters: [...state.activeFilters, filter] })),
    removeFilter: (filterId) => set((state) => ({ activeFilters: state.activeFilters.filter((f) => f.id !== filterId) })),
    clearFilters: () => set({ activeFilters: [] }),

    setLoading: (loading) => set({ isLoading: loading }),
    setError: (error) => set({ error }),
}));
