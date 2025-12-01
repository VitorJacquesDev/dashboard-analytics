import { profileSettingsController } from '@/backend/controllers/ProfileSettingsController';

export const GET = profileSettingsController.get;
export const POST = profileSettingsController.create;
export const PUT = profileSettingsController.update;
export const DELETE = profileSettingsController.delete;
