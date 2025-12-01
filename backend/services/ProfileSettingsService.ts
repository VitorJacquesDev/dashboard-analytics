import { PrismaClient, Theme } from '@prisma/client';
import {
  ProfileSettingsRepository,
  CreateProfileSettingsDto,
  UpdateProfileSettingsDto,
} from '../repositories/ProfileSettingsRepository';
import { UserRepository } from '../repositories/UserRepository';

export interface ProfileSettingsResponse {
  id: string;
  userId: string;
  avatarUrl: string | null;
  bio: string | null;
  language: string;
  timezone: string;
  theme: Theme;
  emailNotifications: boolean;
  pushNotifications: boolean;
  weeklyReportEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const VALID_LANGUAGES = ['pt-BR', 'en-US', 'es-ES', 'fr-FR', 'de-DE'];
const VALID_TIMEZONES = [
  'America/Sao_Paulo',
  'America/New_York',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'UTC',
];

/**
 * ProfileSettingsService - Business logic layer for ProfileSettings operations
 * Handles profile settings management with validation and business rules
 */
export class ProfileSettingsService {
  private profileSettingsRepository: ProfileSettingsRepository;
  private userRepository: UserRepository;

  constructor(prisma?: PrismaClient) {
    this.profileSettingsRepository = new ProfileSettingsRepository(prisma);
    this.userRepository = new UserRepository(prisma);
  }

  /**
   * Create profile settings for a user
   * @throws Error if user not found or settings already exist
   */
  async createProfileSettings(data: CreateProfileSettingsDto): Promise<ProfileSettingsResponse> {
    // Validate user exists
    const user = await this.userRepository.findById(data.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Check if settings already exist
    const existingSettings = await this.profileSettingsRepository.findByUserId(data.userId);
    if (existingSettings) {
      throw new Error('Profile settings already exist for this user');
    }

    // Validate language
    if (data.language && !VALID_LANGUAGES.includes(data.language)) {
      throw new Error(`Invalid language. Valid options: ${VALID_LANGUAGES.join(', ')}`);
    }

    // Validate timezone
    if (data.timezone && !VALID_TIMEZONES.includes(data.timezone)) {
      throw new Error(`Invalid timezone. Valid options: ${VALID_TIMEZONES.join(', ')}`);
    }

    // Validate bio length
    if (data.bio && data.bio.length > 500) {
      throw new Error('Bio must be 500 characters or less');
    }

    const settings = await this.profileSettingsRepository.create(data);
    return settings;
  }

  /**
   * Get profile settings by user ID
   * Creates default settings if they don't exist
   */
  async getProfileSettingsByUserId(userId: string): Promise<ProfileSettingsResponse> {
    // Validate user exists
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    let settings = await this.profileSettingsRepository.findByUserId(userId);

    // Create default settings if they don't exist
    if (!settings) {
      settings = await this.profileSettingsRepository.create({ userId });
    }

    return settings;
  }

  /**
   * Update profile settings for a user
   * @throws Error if user not found or validation fails
   */
  async updateProfileSettings(
    userId: string,
    data: UpdateProfileSettingsDto
  ): Promise<ProfileSettingsResponse> {
    // Validate user exists
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Validate language
    if (data.language && !VALID_LANGUAGES.includes(data.language)) {
      throw new Error(`Invalid language. Valid options: ${VALID_LANGUAGES.join(', ')}`);
    }

    // Validate timezone
    if (data.timezone && !VALID_TIMEZONES.includes(data.timezone)) {
      throw new Error(`Invalid timezone. Valid options: ${VALID_TIMEZONES.join(', ')}`);
    }

    // Validate bio length
    if (data.bio && data.bio.length > 500) {
      throw new Error('Bio must be 500 characters or less');
    }

    // Upsert settings (create if not exists)
    const settings = await this.profileSettingsRepository.upsert(userId, data);
    return settings;
  }

  /**
   * Delete profile settings for a user
   * @throws Error if user not found or settings don't exist
   */
  async deleteProfileSettings(userId: string): Promise<void> {
    // Validate user exists
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Check if settings exist
    const existingSettings = await this.profileSettingsRepository.findByUserId(userId);
    if (!existingSettings) {
      throw new Error('Profile settings not found');
    }

    await this.profileSettingsRepository.deleteByUserId(userId);
  }

  /**
   * Reset profile settings to defaults
   */
  async resetProfileSettings(userId: string): Promise<ProfileSettingsResponse> {
    // Validate user exists
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const defaultSettings: UpdateProfileSettingsDto = {
      avatarUrl: null,
      bio: null,
      language: 'pt-BR',
      timezone: 'America/Sao_Paulo',
      theme: Theme.LIGHT,
      emailNotifications: true,
      pushNotifications: false,
      weeklyReportEnabled: true,
    };

    const settings = await this.profileSettingsRepository.upsert(userId, defaultSettings);
    return settings;
  }

  /**
   * Get available languages
   */
  getAvailableLanguages(): string[] {
    return VALID_LANGUAGES;
  }

  /**
   * Get available timezones
   */
  getAvailableTimezones(): string[] {
    return VALID_TIMEZONES;
  }
}

export const profileSettingsService = new ProfileSettingsService();
