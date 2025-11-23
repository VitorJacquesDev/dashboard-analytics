import { PrismaClient, WidgetType } from '@prisma/client';
import {
  WidgetRepository,
  CreateWidgetDto,
  UpdateWidgetDto,
} from '../repositories/WidgetRepository';
import { DashboardRepository } from '../repositories/DashboardRepository';
import { Widget, Filter } from '@/lib/types';

/**
 * WidgetService - Business logic layer for Widget operations
 * Handles widget management with validation and business rules
 */
export class WidgetService {
  private widgetRepository: WidgetRepository;
  private dashboardRepository: DashboardRepository;

  constructor(prisma?: PrismaClient) {
    this.widgetRepository = new WidgetRepository(prisma);
    this.dashboardRepository = new DashboardRepository(prisma);
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

    // Create widget
    const widget = await this.widgetRepository.create(data);
    return widget as Widget;
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
    return widget as Widget;
  }

  /**
   * Get all widgets for a dashboard
   */
  async getWidgetsByDashboard(dashboardId: string): Promise<Widget[]> {
    const widgets = await this.widgetRepository.findByDashboardId(dashboardId);
    return widgets as Widget[];
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
    return widgets as Widget[];
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

    // Validate title if provided
    if (data.title !== undefined) {
      if (!data.title || data.title.trim().length === 0) {
        throw new Error('Widget title is required');
      }
      if (data.title.length > 200) {
        throw new Error('Widget title must be less than 200 characters');
      }
    }

    // Validate widget type if provided
    if (data.type !== undefined && !Object.values(WidgetType).includes(data.type)) {
      throw new Error('Invalid widget type');
    }

    // Validate data source if provided
    if (data.dataSource !== undefined && (!data.dataSource || data.dataSource.trim().length === 0)) {
      throw new Error('Widget data source is required');
    }

    // Validate config if provided
    if (data.config !== undefined && (typeof data.config !== 'object' || data.config === null)) {
      throw new Error('Widget config must be an object');
    }

    // Update widget
    const updatedWidget = await this.widgetRepository.update(id, data);
    return updatedWidget as Widget;
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
  }

  /**
   * Delete all widgets from a dashboard
   */
  async deleteWidgetsByDashboard(dashboardId: string): Promise<number> {
    return this.widgetRepository.deleteByDashboardId(dashboardId);
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

    return this.widgetRepository.createMany(widgets);
  }

  /**
   * Get widget data with filters applied
   * This is a placeholder for actual data fetching logic
   * In a real implementation, this would query the data source
   */
  async getWidgetData(id: string, filters?: Filter[]): Promise<any> {
    const widget = await this.getWidgetById(id);

    // Placeholder: In real implementation, this would:
    // 1. Parse the dataSource to determine where to fetch data
    // 2. Apply filters to the query
    // 3. Transform data according to widget config
    // 4. Return formatted data for the widget type

    // For now, return mock data structure
    return {
      widgetId: widget.id,
      type: widget.type,
      data: [],
      filters: filters || [],
      timestamp: new Date().toISOString(),
    };
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
