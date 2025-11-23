import { PrismaClient } from '@prisma/client';

/**
 * Base Repository class providing common database operations
 * All specific repositories extend this class
 */
export abstract class BaseRepository {
  protected prisma: PrismaClient;

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma || new PrismaClient();
  }

  /**
   * Get Prisma client instance for transaction support
   */
  getPrisma(): PrismaClient {
    return this.prisma;
  }
}
