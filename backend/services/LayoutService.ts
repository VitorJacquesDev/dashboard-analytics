import { PrismaClient, Theme } from '@prisma/client';
import {
  LayoutRepository,
  CreateLayoutDto,
  UpdateLayoutDto,
} from '../repositories/LayoutRepository';
import { DashboardRepository } from '../repositories/DashboardRepository';
import { Layout } from '@/lib/types';

/**
 * LayoutService - Business logic layer for Layout operations
 * Handles layout persistence with validation and business rules
 */
export class LayoutService {
  private layoutRepository: LayoutRepository;
  private dashboardRepository: DashboardRepository;

  constructor(prisma?: PrismaClient) {
    this.layoutRepository = new LayoutRepository(prisma);
    this.dashboardRepository = new DashboardRepository(prisma);
  }

  /**
   * Save layout (create or update)
   * @throws Error if validation fails or dashboard not found
   */
  async saveLayout(data: CreateLayoutDto): Promise<Layout> {
    // Validate dashboard exists
    const dashboard = await this.dashboardRepository.findById(data.dashboardId);
    if (!dashboard) {
      throw new Error('Dashboard not found');
    }

    // Validate layout is an object
    if (typeof data.layout !== 'object' || data.layout === null) {
      throw new Error('Layout must be an object');
    }

    // Validate theme if provided
    if (data.theme && !Object.values(Theme).includes(data.theme)) {
      throw new Error('Invalid theme');
    }

    // Save layout
    const layout = await this.layoutRepository.save(data);
    return layout as Layout;
  }

  /**
   * Load layout by user and dashboard
   * @throws Error if layout not found
   */
  async loadLayout(userId: string, dashboardId: string): Promise<Layout> {
    const layout = await this.layoutRepository.load(userId, dashboardId);
    if (!layout) {
      throw new Error('Layout not found');
    }
    return layout as Layout;
  }

  /**
   * Get layout by ID
   * @throws Error if layout not found
   */
  async getLayoutById(id: string): Promise<Layout> {
    const layout = await this.layoutRepository.findById(id);
    if (!layout) {
      throw new Error('Layout not found');
    }
    return layout as Layout;
  }

  /**
   * Get all layouts for a user
   */
  async getLayoutsByUser(userId: string): Promise<Layout[]> {
    const layouts = await this.layoutRepository.findByUserId(userId);
    return layouts as Layout[];
  }

  /**
   * Get all layouts for a dashboard
   */
  async getLayoutsByDashboard(dashboardId: string): Promise<Layout[]> {
    const layouts = await this.layoutRepository.findByDashboardId(dashboardId);
    return layouts as Layout[];
  }

  /**
   * Update layout
   * @throws Error if layout not found or validation fails
   */
  async updateLayout(
    userId: string,
    dashboardId: string,
    data: UpdateLayoutDto
  ): Promise<Layout> {
    // Check if layout exists
    const existingLayout = await this.layoutRepository.load(userId, dashboardId);
    if (!existingLayout) {
      throw new Error('Layout not found');
    }

    // Validate layout if provided
    if (data.layout !== undefined && (typeof data.layout !== 'object' || data.layout === null)) {
      throw new Error('Layout must be an object');
    }

    // Validate theme if provided
    if (data.theme !== undefined && !Object.values(Theme).includes(data.theme)) {
      throw new Error('Invalid theme');
    }

    // Update layout
    const updatedLayout = await this.layoutRepository.update(userId, dashboardId, data);
    return updatedLayout as Layout;
  }

  /**
   * Delete layout
   * @throws Error if layout not found
   */
  async deleteLayout(userId: string, dashboardId: string): Promise<void> {
    const layout = await this.layoutRepository.load(userId, dashboardId);
    if (!layout) {
      throw new Error('Layout not found');
    }

    await this.layoutRepository.delete(userId, dashboardId);
  }

  /**
   * Delete all layouts for a user
   */
  async deleteLayoutsByUser(userId: string): Promise<number> {
    return this.layoutRepository.deleteByUserId(userId);
  }

  /**
   * Delete all layouts for a dashboard
   */
  async deleteLayoutsByDashboard(dashboardId: string): Promise<number> {
    return this.layoutRepository.deleteByDashboardId(dashboardId);
  }

  /**
   * Check if layout exists
   */
  async layoutExists(userId: string, dashboardId: string): Promise<boolean> {
    return this.layoutRepository.exists(userId, dashboardId);
  }

  /**
   * Update theme preference
   * @throws Error if layout not found or invalid theme
   */
  async updateTheme(userId: string, dashboardId: string, theme: Theme): Promise<Layout> {
    // Validate theme
    if (!Object.values(Theme).includes(theme)) {
      throw new Error('Invalid theme');
    }

    // Check if layout exists
    const exists = await this.layoutRepository.exists(userId, dashboardId);
    if (!exists) {
      throw new Error('Layout not found');
    }

    const updatedLayout = await this.layoutRepository.updateTheme(userId, dashboardId, theme);
    return updatedLayout as Layout;
  }

  /**
   * Get user's theme preference for a dashboard
   * Returns default theme if no preference is set
   */
  async getTheme(userId: string, dashboardId: string): Promise<Theme> {
    const theme = await this.layoutRepository.getTheme(userId, dashboardId);
    return theme || Theme.LIGHT;
  }

  /**
   * Get or create default layout for user and dashboard
   */
  async getOrCreateLayout(userId: string, dashboardId: string): Promise<Layout> {
    try {
      return await this.loadLayout(userId, dashboardId);
    } catch (error) {
      // If layout doesn't exist, create a default one
      return this.saveLayout({
        userId,
        dashboardId,
        layout: { widgets: [] }, // Default empty layout
        theme: Theme.LIGHT,
      });
    }
  }

  /**
   * Validate layout structure
   * Ensures layout has required properties and valid structure
   */
  validateLayoutStructure(layout: any): boolean {
    if (!layout || typeof layout !== 'object') {
      return false;
    }

    // Basic validation - in real implementation, this would validate
    // the complete layout structure including widget positions, sizes, etc.
    return true;
  }

  /**
   * Clone layout from one user to another
   * Useful for sharing layout configurations
   */
  async cloneLayout(
    sourceUserId: string,
    targetUserId: string,
    dashboardId: string
  ): Promise<Layout> {
    const sourceLayout = await this.loadLayout(sourceUserId, dashboardId);

    return this.saveLayout({
      userId: targetUserId,
      dashboardId,
      layout: sourceLayout.layout,
      theme: sourceLayout.theme,
    });
  }

  /**
   * Upsert layout - create if not exists, update if exists
   */
  async upsertLayout(
    userId: string,
    dashboardId: string,
    data: UpdateLayoutDto
  ): Promise<Layout> {
    const exists = await this.layoutRepository.exists(userId, dashboardId);

    if (exists) {
      return this.updateLayout(userId, dashboardId, data);
    } else {
      return this.saveLayout({
        userId,
        dashboardId,
        layout: data.layout || { widgets: [] },
        theme: data.theme,
      });
    }
  }

  /**
   * Get layout by user and dashboard (returns null if not found)
   */
  async getLayoutByUserAndDashboard(userId: string, dashboardId: string): Promise<Layout | null> {
    const layout = await this.layoutRepository.load(userId, dashboardId);
    return layout as Layout | null;
  }
}

export const layoutService = new LayoutService();
