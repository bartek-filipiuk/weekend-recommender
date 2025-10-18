import argon2 from 'argon2';

/**
 * Password hashing and verification utilities using Argon2id
 *
 * Argon2id is the recommended hashing algorithm for passwords, providing
 * strong resistance against both GPU and side-channel attacks.
 */

/**
 * Hash a plain text password using Argon2id
 *
 * Configuration:
 * - type: argon2id (hybrid approach, resistant to both GPU and side-channel attacks)
 * - memoryCost: 65536 KB (64 MB) - memory usage during hashing
 * - timeCost: 3 iterations - computational cost
 * - parallelism: 4 threads - parallel execution
 *
 * @param password - Plain text password to hash
 * @returns Promise resolving to hashed password string
 * @throws Error if hashing fails
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    return await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 65536, // 64 MB
      timeCost: 3,
      parallelism: 4,
    });
  } catch (error) {
    throw new Error(
      `Failed to hash password: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Verify a plain text password against a hashed password
 *
 * Uses constant-time comparison to prevent timing attacks
 *
 * @param hashedPassword - Previously hashed password from database
 * @param plainPassword - Plain text password to verify
 * @returns Promise resolving to true if passwords match, false otherwise
 */
export async function verifyPassword(
  hashedPassword: string,
  plainPassword: string
): Promise<boolean> {
  try {
    return await argon2.verify(hashedPassword, plainPassword);
  } catch (error) {
    // If verification fails (e.g., invalid hash format), return false
    // Don't throw to prevent information leakage
    console.error('Password verification error:', error);
    return false;
  }
}

/**
 * Validate password strength
 *
 * Requirements:
 * - Minimum 8 characters
 * - At least one letter (a-z or A-Z)
 * - At least one number (0-9)
 *
 * @param password - Password to validate
 * @returns Object with isValid boolean and optional error message
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  error?: string;
} {
  if (!password || password.length < 8) {
    return {
      isValid: false,
      error: 'Password must be at least 8 characters long',
    };
  }

  if (!/[a-zA-Z]/.test(password)) {
    return {
      isValid: false,
      error: 'Password must contain at least one letter',
    };
  }

  if (!/\d/.test(password)) {
    return {
      isValid: false,
      error: 'Password must contain at least one number',
    };
  }

  return { isValid: true };
}
