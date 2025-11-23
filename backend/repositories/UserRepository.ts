import { PrismaClient, User, Role } from '@prisma/client';
import { BaseRepository } from './BaseRepository';

export interface CreateUserDto {
  email: string;
  password: string;
  name: string;
  role?: Role;
}

export interface UpdateUserDto {
  email?: string;
  password?: string;
  name?: string;
  role?: Role;
}

/**
 * UserRepository - Data access layer for User operations
 * Implements CRUD operations for User model
 */
export class UserRepository extends BaseRepository {
  constructor(prisma?: PrismaClient) {
    super(prisma);
  }

  /**
   * Create a new user
   */
  async create(data: CreateUserDto): Promise<User> {
    return this.prisma.user.create({
      data: {
        email: data.email,
        password: data.password,
        name: data.name,
        role: data.role || Role.VIEWER,
      },
    });
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * Find all users with optional filtering
   */
  async findAll(options?: {
    role?: Role;
    skip?: number;
    take?: number;
  }): Promise<User[]> {
    return this.prisma.user.findMany({
      where: options?.role ? { role: options.role } : undefined,
      skip: options?.skip,
      take: options?.take,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Update user by ID
   */
  async update(id: string, data: UpdateUserDto): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete user by ID
   */
  async delete(id: string): Promise<User> {
    return this.prisma.user.delete({
      where: { id },
    });
  }

  /**
   * Count total users
   */
  async count(role?: Role): Promise<number> {
    return this.prisma.user.count({
      where: role ? { role } : undefined,
    });
  }

  /**
   * Check if user exists by email
   */
  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: { email },
    });
    return count > 0;
  }
}
