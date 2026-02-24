import { PrismaClient } from '@prisma/client';
import { prisma as prismaClient } from '@/lib/prisma';

/**
 * Base Repository class providing common database operations
 * All specific repositories extend this class
 */
export abstract class BaseRepository {
  protected prisma: PrismaClient;

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma ?? prismaClient;
  }

  /**
   * Get Prisma client instance for transaction support
   */
  getPrisma(): PrismaClient {
    return this.prisma;
  }
}
