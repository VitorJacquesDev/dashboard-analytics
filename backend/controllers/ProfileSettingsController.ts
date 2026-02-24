import { NextRequest, NextResponse } from 'next/server';
import { profileSettingsService } from '@/backend/services/ProfileSettingsService';
import { authenticateJWT } from '@/backend/middleware/auth';
import { apiError, errorMessageIncludes } from '@/backend/utils/api-error';

export class ProfileSettingsController {
  /**
   * Get current user's profile settings
   * GET /api/profile-settings
   */
  async get(req: NextRequest) {
    try {
      const authResult = await authenticateJWT(req);
      if (authResult instanceof NextResponse) return authResult;

      const settings = await profileSettingsService.getProfileSettingsByUserId(authResult.user.id);
      return NextResponse.json(settings);
    } catch (error: unknown) {
      return apiError(error, { status: 400, request: req });
    }
  }

  /**
   * Create profile settings for current user
   * POST /api/profile-settings
   */
  async create(req: NextRequest) {
    try {
      const authResult = await authenticateJWT(req);
      if (authResult instanceof NextResponse) return authResult;

      const body = await req.json();
      const settings = await profileSettingsService.createProfileSettings({
        userId: authResult.user.id,
        ...body,
      });

      return NextResponse.json(settings, { status: 201 });
    } catch (error: unknown) {
      const status = errorMessageIncludes(error, 'already exist') ? 409 : 400;
      return apiError(error, { status, request: req });
    }
  }

  /**
   * Update current user's profile settings
   * PUT /api/profile-settings
   */
  async update(req: NextRequest) {
    try {
      const authResult = await authenticateJWT(req);
      if (authResult instanceof NextResponse) return authResult;

      const body = await req.json();
      const settings = await profileSettingsService.updateProfileSettings(authResult.user.id, body);

      return NextResponse.json(settings);
    } catch (error: unknown) {
      return apiError(error, { status: 400, request: req });
    }
  }

  /**
   * Delete current user's profile settings
   * DELETE /api/profile-settings
   */
  async delete(req: NextRequest) {
    try {
      const authResult = await authenticateJWT(req);
      if (authResult instanceof NextResponse) return authResult;

      await profileSettingsService.deleteProfileSettings(authResult.user.id);
      return NextResponse.json({ message: 'Profile settings deleted successfully' });
    } catch (error: unknown) {
      const status = errorMessageIncludes(error, 'not found') ? 404 : 400;
      return apiError(error, { status, request: req });
    }
  }

  /**
   * Reset profile settings to defaults
   * POST /api/profile-settings/reset
   */
  async reset(req: NextRequest) {
    try {
      const authResult = await authenticateJWT(req);
      if (authResult instanceof NextResponse) return authResult;

      const settings = await profileSettingsService.resetProfileSettings(authResult.user.id);
      return NextResponse.json(settings);
    } catch (error: unknown) {
      return apiError(error, { status: 400, request: req });
    }
  }

  /**
   * Get available options (languages, timezones)
   * GET /api/profile-settings/options
   */
  async getOptions(_req: NextRequest) {
    return NextResponse.json({
      languages: profileSettingsService.getAvailableLanguages(),
      timezones: profileSettingsService.getAvailableTimezones(),
      themes: ['LIGHT', 'DARK'],
    });
  }
}

export const profileSettingsController = new ProfileSettingsController();
