import { PrismaClient, Role } from '@prisma/client';
import { UserRepository, CreateUserDto, UpdateUserDto } from '../repositories/UserRepository';
import { hashPassword } from '@/lib/utils/password';
import { User } from '@/lib/types';

/**
 * UserService - Business logic layer for User operations
 * Handles user management with validation and business rules
 */
export class UserService {
  private userRepository: UserRepository;

  constructor(prisma?: PrismaClient) {
    this.userRepository = new UserRepository(prisma);
  }

  /**
   * Create a new user with hashed password
   * @throws Error if email already exists or validation fails
   */
  async createUser(data: CreateUserDto): Promise<User> {
    // Validate email format
    if (!this.isValidEmail(data.email)) {
      throw new Error('Invalid email format');
    }

    // Validate password strength
    if (!this.isValidPassword(data.password)) {
      throw new Error('Password must be at least 8 characters long');
    }

    // Check if email already exists
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new Error('Email already exists');
    }

    // Hash password before storing
    const hashedPassword = await hashPassword(data.password);

    // Create user
    const user = await this.userRepository.create({
      ...data,
      password: hashedPassword,
    });

    // Return user without password
    return this.sanitizeUser(user);
  }

  /**
   * Get user by ID
   * @throws Error if user not found
   */
  async getUserById(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new Error('User not found');
    }
    return this.sanitizeUser(user);
  }

  /**
   * Get user by email
   * @throws Error if user not found
   */
  async getUserByEmail(email: string): Promise<User> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }
    return this.sanitizeUser(user);
  }

  /**
   * Get all users with optional filtering
   */
  async getAllUsers(options?: {
    role?: Role;
    skip?: number;
    take?: number;
  }): Promise<User[]> {
    const users = await this.userRepository.findAll(options);
    return users.map((user) => this.sanitizeUser(user));
  }

  /**
   * Update user information
   * @throws Error if user not found or validation fails
   */
  async updateUser(id: string, data: UpdateUserDto): Promise<User> {
    // Check if user exists
    const existingUser = await this.userRepository.findById(id);
    if (!existingUser) {
      throw new Error('User not found');
    }

    // Validate email if provided
    if (data.email && !this.isValidEmail(data.email)) {
      throw new Error('Invalid email format');
    }

    // Check if new email already exists
    if (data.email && data.email !== existingUser.email) {
      const emailExists = await this.userRepository.existsByEmail(data.email);
      if (emailExists) {
        throw new Error('Email already exists');
      }
    }

    // Hash password if provided
    let updateData = { ...data };
    if (data.password) {
      if (!this.isValidPassword(data.password)) {
        throw new Error('Password must be at least 8 characters long');
      }
      updateData.password = await hashPassword(data.password);
    }

    // Update user
    const updatedUser = await this.userRepository.update(id, updateData);
    return this.sanitizeUser(updatedUser);
  }

  /**
   * Delete user
   * @throws Error if user not found
   */
  async deleteUser(id: string): Promise<void> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new Error('User not found');
    }

    await this.userRepository.delete(id);
  }

  /**
   * Get user count by role
   */
  async getUserCount(role?: Role): Promise<number> {
    return this.userRepository.count(role);
  }

  /**
   * Check if user exists by email
   */
  async userExists(email: string): Promise<boolean> {
    return this.userRepository.existsByEmail(email);
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate password strength
   */
  private isValidPassword(password: string): boolean {
    return password.length >= 8;
  }

  /**
   * Remove password from user object
   */
  private sanitizeUser(user: any): User {
    const { password, ...sanitized } = user;
    return sanitized as User;
  }
}

export const userService = new UserService();
