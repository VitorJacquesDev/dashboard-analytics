/**
 * Repository Layer - Data Access Layer
 * 
 * This module exports all repository classes for database operations.
 * Repositories provide a clean abstraction over Prisma ORM operations.
 */

export { BaseRepository } from './BaseRepository';
export { UserRepository } from './UserRepository';
export { DashboardRepository } from './DashboardRepository';
export { WidgetRepository } from './WidgetRepository';
export { LayoutRepository } from './LayoutRepository';
export { ScheduleRepository } from './ScheduleRepository';

// Export DTOs
export type {
  CreateUserDto,
  UpdateUserDto,
} from './UserRepository';

export type {
  CreateDashboardDto,
  UpdateDashboardDto,
  ShareDashboardDto,
} from './DashboardRepository';

export type {
  CreateWidgetDto,
  UpdateWidgetDto,
} from './WidgetRepository';

export type {
  CreateLayoutDto,
  UpdateLayoutDto,
} from './LayoutRepository';

export type {
  CreateScheduleDto,
  UpdateScheduleDto,
} from './ScheduleRepository';
