import type {
  Dashboard as PrismaDashboard,
  ExportFormat as PrismaExportFormat,
  Layout as PrismaLayout,
  Permission as PrismaPermission,
  Prisma,
  ProfileSettings as PrismaProfileSettings,
  Role as PrismaRole,
  Theme as PrismaTheme,
  User as PrismaUser,
  Widget as PrismaWidget,
  WidgetType as PrismaWidgetType,
} from '@prisma/client';

// Common types for Dashboard Analytics
type PrismaEnumObject<T extends string> = {
  [K in T]: K;
};

export const Role: PrismaEnumObject<PrismaRole> = {
  ADMIN: 'ADMIN',
  ANALYST: 'ANALYST',
  VIEWER: 'VIEWER',
};
export type Role = PrismaRole;

export const WidgetType: PrismaEnumObject<PrismaWidgetType> = {
  LINE_CHART: 'LINE_CHART',
  BAR_CHART: 'BAR_CHART',
  PIE_CHART: 'PIE_CHART',
  AREA_CHART: 'AREA_CHART',
  HEATMAP: 'HEATMAP',
  SCATTER_CHART: 'SCATTER_CHART',
  TABLE: 'TABLE',
  METRIC: 'METRIC',
};
export type WidgetType = PrismaWidgetType;

export const Theme: PrismaEnumObject<PrismaTheme> = {
  LIGHT: 'LIGHT',
  DARK: 'DARK',
};
export type Theme = PrismaTheme;

export const Permission: PrismaEnumObject<PrismaPermission> = {
  VIEW: 'VIEW',
  EDIT: 'EDIT',
  ADMIN: 'ADMIN',
};
export type Permission = PrismaPermission;

export const ExportFormat: PrismaEnumObject<PrismaExportFormat> = {
  PDF: 'PDF',
  CSV: 'CSV',
  XLSX: 'XLSX',
};
export type ExportFormat = PrismaExportFormat;

// Shared model aliases derived from Prisma to avoid schema drift.
export type JsonObject = Record<string, unknown> & Prisma.JsonObject;

export type User = Omit<PrismaUser, 'password'>;

export type Dashboard = PrismaDashboard;

export type Widget = PrismaWidget;

export type Layout = PrismaLayout;

export type ProfileSettings = PrismaProfileSettings;

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

export interface AuthSession {
  expiresIn: string;
  user: User;
}

export interface AuthToken extends AuthSession {
  token: string;
}
