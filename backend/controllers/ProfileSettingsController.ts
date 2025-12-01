import { NextRequest, NextResponse } from 'next/server';
import { profileSettingsService } from '@/backend/services/ProfileSettingsService';
import { authenticateJWT } from '@/backend/middleware/auth';

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
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 400 });
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
    } catch (error: any) {
      const status = error.message.includes('already exist') ? 409 : 400;
      return NextResponse.json({ error: error.message }, { status });
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
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 400 });
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
    } catch (error: any) {
      const status = error.message.includes('not found') ? 404 : 400;
      return NextResponse.json({ error: error.message }, { status });
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
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 400 });
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
