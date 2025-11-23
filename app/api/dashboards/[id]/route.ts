import { dashboardController } from '@/backend/controllers/DashboardController';

export const GET = dashboardController.getOne;
export const PATCH = dashboardController.update;
export const DELETE = dashboardController.delete;
