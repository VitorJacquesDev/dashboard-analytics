/**
 * @jest-environment node
 */
import * as fc from 'fast-check';
import { generateToken } from '@/lib/utils/jwt';
import { Role } from '@/lib/types';
import { authService } from '@/backend/services/AuthService';

/**
 * Feature: dashboard-analytics, Property 29: JWT authentication enforcement
 * Validates: Requirements 8.4
 * 
 * Property: For any protected API endpoint, requests without valid JWT token 
 * should be rejected with HTTP 401
 */

describe('JWT Authentication Middleware', () => {
  describe('Property 29: JWT authentication enforcement', () => {
    it('should reject null or undefined Authorization header', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(null, undefined, ''),
          async (authHeader) => {
            // Extract token should return null for invalid headers
            const token = authService.extractTokenFromHeader(authHeader);
            expect(token).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject malformed Authorization headers', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }), // Random prefix
          fc.string({ minLength: 10, maxLength: 100 }), // Random token
          async (prefix, token) => {
            // Skip if prefix is "Bearer" (that's the valid case)
            fc.pre(prefix !== 'Bearer');

            const authHeader = `${prefix} ${token}`;
            const extractedToken = authService.extractTokenFromHeader(authHeader);
            
            // Should return null for malformed headers
            expect(extractedToken).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject invalid JWT tokens', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 20, maxLength: 200 }), // Random string as invalid token
          async (invalidToken) => {
            // Ensure it's not a valid JWT format
            fc.pre(!invalidToken.includes('.') || invalidToken.split('.').length !== 3);

            // Attempt to validate invalid token should throw
            await expect(authService.validateToken(invalidToken)).rejects.toThrow();
          }
        ),
        { numRuns: 100 }
      );
    });

    // Note: This test requires database connection and is skipped in unit tests
    // It should be run as part of integration tests
    it.skip('should reject tokens for non-existent users', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // Random user ID that doesn't exist
          fc.emailAddress(),
          fc.constantFrom(Role.ADMIN, Role.ANALYST, Role.VIEWER),
          async (userId, email, role) => {
            // Generate a valid token structure but for non-existent user
            const token = generateToken({
              userId,
              email,
              role,
            });

            // Validation should fail because user doesn't exist in database
            await expect(authService.validateToken(token)).rejects.toThrow('User not found');
          }
        ),
        { numRuns: 10 } // Reduced runs to avoid timeout with database calls
      );
    }, 30000); // Increased timeout for database operations

    it('should reject empty tokens', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constant(''),
          async (emptyToken) => {
            // Empty token should be rejected
            await expect(authService.validateToken(emptyToken)).rejects.toThrow();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should extract valid Bearer tokens correctly (non-whitespace tokens)', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate tokens without any whitespace (realistic JWT tokens)
          fc.string({ minLength: 20, maxLength: 200 }).filter(s => !/\s/.test(s) && s.length >= 20),
          async (token) => {
            const authHeader = `Bearer ${token}`;
            const extractedToken = authService.extractTokenFromHeader(authHeader);
            
            // Should extract the token correctly
            expect(extractedToken).toBe(token);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject tokens with whitespace', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 20, maxLength: 200 }).filter(s => s !== s.trim() && s.trim().length > 0),
          async (token) => {
            const authHeader = `Bearer ${token}`;
            const extractedToken = authService.extractTokenFromHeader(authHeader);
            
            // Should reject tokens with leading/trailing whitespace
            expect(extractedToken).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject Authorization header with only "Bearer"', async () => {
      const authHeader = 'Bearer';
      const token = authService.extractTokenFromHeader(authHeader);
      
      // Should return null when no token after "Bearer"
      expect(token).toBeNull();
    });

    it('should reject Authorization header with extra spaces', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 10, maxLength: 100 }),
          async (token) => {
            // Test with multiple spaces
            const authHeader = `Bearer  ${token}`; // Two spaces
            const extractedToken = authService.extractTokenFromHeader(authHeader);
            
            // Should return null for malformed header
            expect(extractedToken).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
