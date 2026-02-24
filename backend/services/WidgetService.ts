import { PrismaClient, WidgetType } from '@prisma/client';
import {
  WidgetRepository,
  CreateWidgetDto,
  UpdateWidgetDto,
} from '../repositories/WidgetRepository';
import { DashboardRepository } from '../repositories/DashboardRepository';
import { Widget, Filter } from '@/lib/types';
import {
  WidgetDataProviderRegistry,
  createDefaultWidgetDataProviderRegistry,
} from './widget-data';
import { validateWidgetConfigByDataSource } from '@/backend/validation/widget-data-source-config';

/**
 * WidgetService - Business logic layer for Widget operations
 * Handles widget management with validation and business rules
 */
export class WidgetService {
  private static readonly DEFAULT_WIDGET_DATA_CACHE_TTL_MS = 30_000;
  private static widgetDataCache = new Map<
    string,
    {
      expiresAt: number;
      value: any;
    }
  >();

  private widgetRepository: WidgetRepository;
  private dashboardRepository: DashboardRepository;
  private widgetDataProviderRegistry: WidgetDataProviderRegistry;

  constructor(prisma?: PrismaClient) {
    this.widgetRepository = new WidgetRepository(prisma);
    this.dashboardRepository = new DashboardRepository(prisma);
    this.widgetDataProviderRegistry = createDefaultWidgetDataProviderRegistry();
  }

  /**
   * Create a new widget
   * @throws Error if validation fails or dashboard not found
   */
  async createWidget(data: CreateWidgetDto): Promise<Widget> {
    // Validate dashboard exists
    const dashboard = await this.dashboardRepository.findById(data.dashboardId);
    if (!dashboard) {
      throw new Error('Dashboard not found');
    }

    // Validate title
    if (!data.title || data.title.trim().length === 0) {
      throw new Error('Widget title is required');
    }

    if (data.title.length > 200) {
      throw new Error('Widget title must be less than 200 characters');
    }

    // Validate widget type
    if (!Object.values(WidgetType).includes(data.type)) {
      throw new Error('Invalid widget type');
    }

    // Validate data source
    if (!data.dataSource || data.dataSource.trim().length === 0) {
      throw new Error('Widget data source is required');
    }

    // Validate config is an object
    if (typeof data.config !== 'object' || data.config === null) {
      throw new Error('Widget config must be an object');
    }

    const normalizedConfig = validateWidgetConfigByDataSource(data.dataSource, data.config, data.type);

    // Create widget
    const widget = await this.widgetRepository.create({
      ...data,
      config: normalizedConfig,
    });
    this.invalidateAllWidgetDataCache();
    return widget;
  }

  /**
   * Get widget by ID
   * @throws Error if widget not found
   */
  async getWidgetById(id: string): Promise<Widget> {
    const widget = await this.widgetRepository.findById(id);
    if (!widget) {
      throw new Error('Widget not found');
    }
    return widget;
  }

  /**
   * Get all widgets for a dashboard
   */
  async getWidgetsByDashboard(dashboardId: string): Promise<Widget[]> {
    const widgets = await this.widgetRepository.findByDashboardId(dashboardId);
    return widgets;
  }

  /**
   * Get widgets by type
   */
  async getWidgetsByType(
    type: WidgetType,
    options?: {
      skip?: number;
      take?: number;
    }
  ): Promise<Widget[]> {
    const widgets = await this.widgetRepository.findByType(type, options);
    return widgets;
  }

  /**
   * Update widget
   * @throws Error if widget not found or validation fails
   */
  async updateWidget(id: string, data: UpdateWidgetDto): Promise<Widget> {
    // Check if widget exists
    const existingWidget = await this.widgetRepository.findById(id);
    if (!existingWidget) {
      throw new Error('Widget not found');
    }

    const normalizedUpdateData: UpdateWidgetDto = { ...data };

    // Validate title if provided
    if (normalizedUpdateData.title !== undefined) {
      if (!normalizedUpdateData.title || normalizedUpdateData.title.trim().length === 0) {
        throw new Error('Widget title is required');
      }
      if (normalizedUpdateData.title.length > 200) {
        throw new Error('Widget title must be less than 200 characters');
      }
    }

    // Validate widget type if provided
    if (
      normalizedUpdateData.type !== undefined &&
      !Object.values(WidgetType).includes(normalizedUpdateData.type)
    ) {
      throw new Error('Invalid widget type');
    }

    // Validate data source if provided
    if (
      normalizedUpdateData.dataSource !== undefined &&
      (!normalizedUpdateData.dataSource || normalizedUpdateData.dataSource.trim().length === 0)
    ) {
      throw new Error('Widget data source is required');
    }

    // Validate config if provided
    if (
      normalizedUpdateData.config !== undefined &&
      (typeof normalizedUpdateData.config !== 'object' || normalizedUpdateData.config === null)
    ) {
      throw new Error('Widget config must be an object');
    }

    const effectiveType = normalizedUpdateData.type ?? existingWidget.type;
    const effectiveDataSource = normalizedUpdateData.dataSource ?? existingWidget.dataSource;
    const effectiveConfig = normalizedUpdateData.config ?? existingWidget.config;
    const normalizedEffectiveConfig = validateWidgetConfigByDataSource(
      effectiveDataSource,
      effectiveConfig,
      effectiveType
    );

    if (normalizedUpdateData.config !== undefined) {
      normalizedUpdateData.config = normalizedEffectiveConfig;
    }

    // Update widget
    const updatedWidget = await this.widgetRepository.update(id, normalizedUpdateData);
    this.invalidateAllWidgetDataCache();
    return updatedWidget;
  }

  /**
   * Delete widget
   * @throws Error if widget not found
   */
  async deleteWidget(id: string): Promise<void> {
    const widget = await this.widgetRepository.findById(id);
    if (!widget) {
      throw new Error('Widget not found');
    }

    await this.widgetRepository.delete(id);
    this.invalidateAllWidgetDataCache();
  }

  /**
   * Delete all widgets from a dashboard
   */
  async deleteWidgetsByDashboard(dashboardId: string): Promise<number> {
    const deletedCount = await this.widgetRepository.deleteByDashboardId(dashboardId);
    this.invalidateAllWidgetDataCache();
    return deletedCount;
  }

  /**
   * Count widgets in a dashboard
   */
  async countByDashboard(dashboardId: string): Promise<number> {
    return this.widgetRepository.countByDashboard(dashboardId);
  }

  /**
   * Bulk create widgets
   */
  async createManyWidgets(widgets: CreateWidgetDto[]): Promise<number> {
    // Validate all widgets
    for (const widget of widgets) {
      if (!widget.title || widget.title.trim().length === 0) {
        throw new Error('All widgets must have a title');
      }
      if (!Object.values(WidgetType).includes(widget.type)) {
        throw new Error('Invalid widget type');
      }
      if (!widget.dataSource || widget.dataSource.trim().length === 0) {
        throw new Error('All widgets must have a data source');
      }
    }

    const createdCount = await this.widgetRepository.createMany(widgets);
    this.invalidateAllWidgetDataCache();
    return createdCount;
  }

  /**
   * Get widget data with filters applied
   * Data resolution is delegated to a provider registry (real and mock providers).
   */
  async getWidgetData(id: string, filters?: Filter[]): Promise<any> {
    const widget = await this.getWidgetById(id);
    const cacheKey = this.buildWidgetDataCacheKey(widget, filters);
    const cachedEntry = this.getCachedWidgetData(cacheKey);

    if (cachedEntry) {
      return cachedEntry.value;
    }

    const data = await this.widgetDataProviderRegistry.getData({
      prisma: this.widgetRepository.getPrisma(),
      widget,
      filters,
    });

    this.setCachedWidgetData(cacheKey, data);
    return data;
  }

  private getWidgetDataCacheTTL(): number {
    const rawTtl = process.env.WIDGET_DATA_CACHE_TTL_MS;
    const ttlFromEnv = rawTtl ? Number(rawTtl) : NaN;

    if (Number.isFinite(ttlFromEnv) && ttlFromEnv >= 0) {
      return ttlFromEnv;
    }

    return WidgetService.DEFAULT_WIDGET_DATA_CACHE_TTL_MS;
  }

  private buildWidgetDataCacheKey(widget: Widget, filters?: Filter[]): string {
    const signature = this.stableStringify({
      updatedAt: widget.updatedAt instanceof Date ? widget.updatedAt.toISOString() : widget.updatedAt,
      type: widget.type,
      dataSource: widget.dataSource,
      config: widget.config,
      filters: filters ?? [],
    });

    return `${widget.id}::${signature}`;
  }

  private getCachedWidgetData(cacheKey: string): { expiresAt: number; value: any } | undefined {
    this.pruneExpiredWidgetDataCache();

    const entry = WidgetService.widgetDataCache.get(cacheKey);
    if (!entry) {
      return undefined;
    }

    if (entry.expiresAt <= Date.now()) {
      WidgetService.widgetDataCache.delete(cacheKey);
      return undefined;
    }

    return entry;
  }

  private setCachedWidgetData(cacheKey: string, value: any): void {
    const ttlMs = this.getWidgetDataCacheTTL();
    if (ttlMs <= 0) {
      return;
    }

    WidgetService.widgetDataCache.set(cacheKey, {
      value,
      expiresAt: Date.now() + ttlMs,
    });
  }

  private invalidateAllWidgetDataCache(): void {
    WidgetService.widgetDataCache.clear();
  }

  private pruneExpiredWidgetDataCache(): void {
    const now = Date.now();

    for (const [cacheKey, entry] of WidgetService.widgetDataCache.entries()) {
      if (entry.expiresAt <= now) {
        WidgetService.widgetDataCache.delete(cacheKey);
      }
    }
  }

  private stableStringify(value: unknown): string {
    if (value === null || value === undefined) {
      return JSON.stringify(value) ?? 'null';
    }

    if (value instanceof Date) {
      return JSON.stringify(value.toISOString());
    }

    if (Array.isArray(value)) {
      return `[${value.map((item) => this.stableStringify(item)).join(',')}]`;
    }

    if (typeof value !== 'object') {
      return JSON.stringify(value) ?? 'null';
    }

    const record = value as Record<string, unknown>;
    const keys = Object.keys(record).sort();
    const entries = keys.map((key) => `${JSON.stringify(key)}:${this.stableStringify(record[key])}`);

    return `{${entries.join(',')}}`;
  }

  static clearWidgetDataCacheForTests(): void {
    WidgetService.clearWidgetDataCache();
  }

  static clearWidgetDataCache(): void {
    WidgetService.widgetDataCache.clear();
  }

  /**
   * Validate widget configuration for a specific type
   */
  validateWidgetConfig(type: WidgetType, config: any): boolean {
    // Basic validation - in real implementation, this would validate
    // type-specific configuration requirements
    if (!config || typeof config !== 'object') {
      return false;
    }

    // Type-specific validation could be added here
    switch (type) {
      case WidgetType.LINE_CHART:
      case WidgetType.BAR_CHART:
      case WidgetType.AREA_CHART:
        // Validate chart-specific config
        return true;
      case WidgetType.PIE_CHART:
        // Validate pie chart config
        return true;
      case WidgetType.HEATMAP:
      case WidgetType.SCATTER_CHART:
        // Validate heatmap/scatter config
        return true;
      case WidgetType.TABLE:
      case WidgetType.METRIC:
        // Validate table/metric config
        return true;
      default:
        return false;
    }
  }
}

export const widgetService = new WidgetService();
