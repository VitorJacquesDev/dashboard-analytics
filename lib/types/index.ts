// Common types for Dashboard Analytics

export enum Role {
  ADMIN = 'ADMIN',
  ANALYST = 'ANALYST',
  VIEWER = 'VIEWER',
}

export enum WidgetType {
  LINE_CHART = 'LINE_CHART',
  BAR_CHART = 'BAR_CHART',
  PIE_CHART = 'PIE_CHART',
  AREA_CHART = 'AREA_CHART',
  HEATMAP = 'HEATMAP',
  SCATTER_CHART = 'SCATTER_CHART',
  TABLE = 'TABLE',
  METRIC = 'METRIC',
}

export enum Theme {
  LIGHT = 'LIGHT',
  DARK = 'DARK',
}

export enum Permission {
  VIEW = 'VIEW',
  EDIT = 'EDIT',
  ADMIN = 'ADMIN',
}

export enum ExportFormat {
  PDF = 'PDF',
  CSV = 'CSV',
  XLSX = 'XLSX',
  PNG = 'PNG',
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

export interface Dashboard {
  id: string;
  title: string;
  description?: string;
  userId: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Widget {
  id: string;
  dashboardId: string;
  type: WidgetType;
  title: string;
  config: Record<string, unknown>;
  dataSource: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Layout {
  id: string;
  userId: string;
  dashboardId: string;
  layout: Record<string, unknown>;
  theme: Theme;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProfileSettings {
  id: string;
  userId: string;
  avatarUrl: string | null;
  bio: string | null;
  language: string;
  timezone: string;
  theme: Theme;
  emailNotifications: boolean;
  pushNotifications: boolean;
  weeklyReportEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChartData {
  x: number | string | Date;
  y: number;
  label?: string;
  [key: string]: unknown;
}

export interface ChartConfig {
  width?: number;
  height?: number;
  margin?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  colors?: string[];
  showLegend?: boolean;
  showGrid?: boolean;
  enableZoom?: boolean;
  enableTooltip?: boolean;
  [key: string]: unknown;
}

export interface Filter {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains';
  value: unknown;
}

export interface ActiveFilter extends Filter {
  id: string;
  label: string;
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
    timestamp: string;
    requestId: string;
  };
}

export interface AuthToken {
  token: string;
  expiresIn: string;
  user: User;
}
