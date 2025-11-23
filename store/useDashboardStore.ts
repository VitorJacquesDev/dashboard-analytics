import { create } from 'zustand';
import { Dashboard, Widget } from '@/lib/types';

interface DashboardState {
    dashboards: Dashboard[];
    activeDashboard: Dashboard | null;
    widgets: Widget[];
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

    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
    dashboards: [],
    activeDashboard: null,
    widgets: [],
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

    setLoading: (loading) => set({ isLoading: loading }),
    setError: (error) => set({ error }),
}));
