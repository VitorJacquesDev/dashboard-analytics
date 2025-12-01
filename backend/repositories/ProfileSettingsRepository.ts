import { PrismaClient, ProfileSettings, Theme } from '@prisma/client';
import { BaseRepository } from './BaseRepository';

export interface CreateProfileSettingsDto {
  userId: string;
  avatarUrl?: string;
  bio?: string;
  language?: string;
  timezone?: string;
  theme?: Theme;
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  weeklyReportEnabled?: boolean;
}

export interface UpdateProfileSettingsDto {
  avatarUrl?: string | null;
  bio?: string | null;
  language?: string;
  timezone?: string;
  theme?: Theme;
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  weeklyReportEnabled?: boolean;
}

/**
 * ProfileSettingsRepository - Data access layer for ProfileSettings operations
 * Implements CRUD operations for ProfileSettings model
 */
export class ProfileSettingsRepository extends BaseRepository {
  constructor(prisma?: PrismaClient) {
    super(prisma);
  }

  /**
   * Create profile settings for a user
   */
  async create(data: CreateProfileSettingsDto): Promise<ProfileSettings> {
    return this.prisma.profileSettings.create({
      data: {
        userId: data.userId,
        avatarUrl: data.avatarUrl,
        bio: data.bio,
        language: data.language || 'pt-BR',
        timezone: data.timezone || 'America/Sao_Paulo',
        theme: data.theme || Theme.LIGHT,
        emailNotifications: data.emailNotifications ?? true,
        pushNotifications: data.pushNotifications ?? false,
        weeklyReportEnabled: data.weeklyReportEnabled ?? true,
      },
    });
  }

  /**
   * Find profile settings by ID
   */
  async findById(id: string): Promise<ProfileSettings | null> {
    return this.prisma.profileSettings.findUnique({
      where: { id },
    });
  }

  /**
   * Find profile settings by user ID
   */
  async findByUserId(userId: string): Promise<ProfileSettings | null> {
    return this.prisma.profileSettings.findUnique({
      where: { userId },
    });
  }

  /**
   * Update profile settings by user ID
   */
  async updateByUserId(userId: string, data: UpdateProfileSettingsDto): Promise<ProfileSettings> {
    return this.prisma.profileSettings.update({
      where: { userId },
      data,
    });
  }

  /**
   * Delete profile settings by user ID
   */
  async deleteByUserId(userId: string): Promise<ProfileSettings> {
    return this.prisma.profileSettings.delete({
      where: { userId },
    });
  }

  /**
   * Upsert profile settings (create if not exists, update if exists)
   */
  async upsert(userId: string, data: UpdateProfileSettingsDto): Promise<ProfileSettings> {
    return this.prisma.profileSettings.upsert({
      where: { userId },
      create: {
        userId,
        ...data,
      },
      update: data,
    });
  }

  /**
   * Check if profile settings exist for a user
   */
  async existsByUserId(userId: string): Promise<boolean> {
    const count = await this.prisma.profileSettings.count({
      where: { userId },
    });
    return count > 0;
  }
}
