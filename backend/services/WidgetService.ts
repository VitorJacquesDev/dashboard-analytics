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

    // Simulate data fetching based on widget type
    // In a real app, we would query the database using widget.dataSource

    let data: any[] = [];

    switch (widget.type) {
      case WidgetType.PIE_CHART:
        data = [
          { x: 'Direct', y: Math.floor(Math.random() * 50) + 10 },
          { x: 'Social', y: Math.floor(Math.random() * 40) + 10 },
          { x: 'Organic', y: Math.floor(Math.random() * 60) + 20 },
          { x: 'Referral', y: Math.floor(Math.random() * 30) + 5 },
        ];
        break;

      case WidgetType.SCATTER_CHART:
        data = Array.from({ length: 20 }, () => ({
          x: Math.floor(Math.random() * 100),
          y: Math.floor(Math.random() * 100),
          label: 'Point',
        }));
        break;

      case WidgetType.HEATMAP:
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
        const times = ['Morning', 'Afternoon', 'Evening'];
        days.forEach(day => {
          times.forEach(time => {
            data.push({
              x: day,
              label: time,
              y: Math.floor(Math.random() * 100),
            });
          });
        });
        break;

      case WidgetType.TABLE:
        data = Array.from({ length: 5 }, (_, i) => ({
          id: i + 1,
          name: `Item ${i + 1}`,
          category: ['A', 'B', 'C'][Math.floor(Math.random() * 3)],
          value: Math.floor(Math.random() * 1000),
          status: Math.random() > 0.5 ? 'Active' : 'Inactive',
        }));
        break;

      case WidgetType.METRIC:
        data = [{
          x: 'Total Revenue',
          y: Math.floor(Math.random() * 50000) + 10000,
        }];
        break;

      default: // LINE_CHART, BAR_CHART, AREA_CHART
        data = Array.from({ length: 7 }, (_, i) => ({
          x: `Day ${i + 1}`,
          y: Math.floor(Math.random() * 100),
        }));
    }

    return data;
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
