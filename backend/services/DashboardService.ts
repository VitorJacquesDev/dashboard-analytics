import { PrismaClient, Permission } from '@prisma/client';
import {
  DashboardRepository,
  CreateDashboardDto,
  UpdateDashboardDto,
  ShareDashboardDto,
} from '../repositories/DashboardRepository';
import { Dashboard } from '@/lib/types';

/**
 * DashboardService - Business logic layer for Dashboard operations
 * Handles dashboard management with validation and business rules
 */
export class DashboardService {
  private dashboardRepository: DashboardRepository;

  constructor(prisma?: PrismaClient) {
    this.dashboardRepository = new DashboardRepository(prisma);
  }

  /**
   * Create a new dashboard
   * @throws Error if validation fails
   */
  async createDashboard(data: CreateDashboardDto): Promise<Dashboard> {
    // Validate title
    if (!data.title || data.title.trim().length === 0) {
      throw new Error('Dashboard title is required');
    }

    if (data.title.length > 200) {
      throw new Error('Dashboard title must be less than 200 characters');
    }

    // Validate description if provided
    if (data.description && data.description.length > 1000) {
      throw new Error('Dashboard description must be less than 1000 characters');
    }

    // Create dashboard
    const dashboard = await this.dashboardRepository.create(data);
    return dashboard as Dashboard;
  }

  /**
   * Get dashboard by ID
   * @throws Error if dashboard not found
   */
  async getDashboardById(id: string, includeRelations = false): Promise<Dashboard> {
    const dashboard = await this.dashboardRepository.findById(id, includeRelations);
    if (!dashboard) {
      throw new Error('Dashboard not found');
    }
    return dashboard as Dashboard;
  }

  /**
   * Get all dashboards for a user
   */
  async getDashboardsByUser(
    userId: string,
    options?: {
      skip?: number;
      take?: number;
      includeShared?: boolean;
    }
  ): Promise<Dashboard[]> {
    const dashboards = await this.dashboardRepository.findByUserId(userId, options);
    return dashboards as Dashboard[];
  }

  /**
   * Get all public dashboards
   */
  async getPublicDashboards(options?: {
    skip?: number;
    take?: number;
  }): Promise<Dashboard[]> {
    const dashboards = await this.dashboardRepository.findPublic(options);
    return dashboards as Dashboard[];
  }

  /**
   * Update dashboard
   * @throws Error if dashboard not found or validation fails
   */
  async updateDashboard(id: string, data: UpdateDashboardDto): Promise<Dashboard> {
    // Check if dashboard exists
    const existingDashboard = await this.dashboardRepository.findById(id);
    if (!existingDashboard) {
      throw new Error('Dashboard not found');
    }

    // Validate title if provided
    if (data.title !== undefined) {
      if (!data.title || data.title.trim().length === 0) {
        throw new Error('Dashboard title is required');
      }
      if (data.title.length > 200) {
        throw new Error('Dashboard title must be less than 200 characters');
      }
    }

    // Validate description if provided
    if (data.description !== undefined && data.description && data.description.length > 1000) {
      throw new Error('Dashboard description must be less than 1000 characters');
    }

    // Update dashboard
    const updatedDashboard = await this.dashboardRepository.update(id, data);
    return updatedDashboard as Dashboard;
  }

  /**
   * Delete dashboard
   * @throws Error if dashboard not found
   */
  async deleteDashboard(id: string): Promise<void> {
    const dashboard = await this.dashboardRepository.findById(id);
    if (!dashboard) {
      throw new Error('Dashboard not found');
    }

    await this.dashboardRepository.delete(id);
  }

  /**
   * Share dashboard with a user
   * @throws Error if dashboard not found or validation fails
   */
  async shareDashboard(data: ShareDashboardDto): Promise<void> {
    // Check if dashboard exists
    const dashboard = await this.dashboardRepository.findById(data.dashboardId);
    if (!dashboard) {
      throw new Error('Dashboard not found');
    }

    // Validate permission
    if (!Object.values(Permission).includes(data.permission)) {
      throw new Error('Invalid permission level');
    }

    await this.dashboardRepository.share(data);
  }

  /**
   * Unshare dashboard from a user
   * @throws Error if dashboard not found
   */
  async unshareDashboard(dashboardId: string, userId: string): Promise<void> {
    // Check if dashboard exists
    const dashboard = await this.dashboardRepository.findById(dashboardId);
    if (!dashboard) {
      throw new Error('Dashboard not found');
    }

    await this.dashboardRepository.unshare(dashboardId, userId);
  }

  /**
   * Get all users who have access to a dashboard
   */
  async getSharedUsers(dashboardId: string) {
    const dashboard = await this.dashboardRepository.findById(dashboardId);
    if (!dashboard) {
      throw new Error('Dashboard not found');
    }

    return this.dashboardRepository.getSharedUsers(dashboardId);
  }

  /**
   * Check if user has access to dashboard
   */
  async hasAccess(dashboardId: string, userId: string): Promise<boolean> {
    return this.dashboardRepository.hasAccess(dashboardId, userId);
  }

  /**
   * Get user's permission level for a dashboard
   */
  async getUserPermission(dashboardId: string, userId: string): Promise<Permission | null> {
    return this.dashboardRepository.getUserPermission(dashboardId, userId);
  }

  /**
   * Count dashboards by user
   */
  async countByUser(userId: string): Promise<number> {
    return this.dashboardRepository.countByUser(userId);
  }

  /**
   * Verify user can modify dashboard
   * @throws Error if user doesn't have permission
   */
  async verifyModifyPermission(dashboardId: string, userId: string): Promise<void> {
    const permission = await this.getUserPermission(dashboardId, userId);
    
    if (!permission) {
      throw new Error('Access denied');
    }

    if (permission === Permission.VIEW) {
      throw new Error('Insufficient permissions to modify dashboard');
    }
  }

  /**
   * Verify user can delete dashboard
   * @throws Error if user doesn't have permission
   */
  async verifyDeletePermission(dashboardId: string, userId: string): Promise<void> {
    const dashboard = await this.dashboardRepository.findById(dashboardId);
    
    if (!dashboard) {
      throw new Error('Dashboard not found');
    }

    // Only owner or admin permission can delete
    if (dashboard.userId !== userId) {
      const permission = await this.getUserPermission(dashboardId, userId);
      if (permission !== Permission.ADMIN) {
        throw new Error('Only dashboard owner can delete');
      }
    }
  }
}

export const dashboardService = new DashboardService();
