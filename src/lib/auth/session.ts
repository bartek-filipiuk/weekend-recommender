import { db } from '@/db';
import { sessions, users, type Session, type NewSession } from '@/db/schema';
import { eq, and, gt, lt } from 'drizzle-orm';
import { randomBytes } from 'crypto';

/**
 * Session management utilities
 *
 * Handles creation, validation, and cleanup of user sessions
 * Sessions are stored in the database with a 7-day expiration
 */

/**
 * Session duration in milliseconds (7 days)
 */
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Cookie configuration for session token
 */
export const SESSION_COOKIE_NAME = 'weekend_session';

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: SESSION_DURATION_MS / 1000, // Convert to seconds for cookie
  path: '/',
};

/**
 * Generate a cryptographically secure session token
 *
 * Uses Node.js crypto.randomBytes for secure random generation
 *
 * @returns Promise resolving to 64-character hexadecimal token
 */
export async function generateSessionToken(): Promise<string> {
  return new Promise((resolve, reject) => {
    randomBytes(32, (err, buffer) => {
      if (err) {
        reject(new Error('Failed to generate session token'));
      } else {
        resolve(buffer.toString('hex'));
      }
    });
  });
}

/**
 * Create a new session for a user
 *
 * Generates a secure session token and stores it in the database
 * with a 7-day expiration timestamp
 *
 * @param userId - User ID to create session for
 * @returns Promise resolving to session token string
 * @throws Error if session creation fails
 */
export async function createSession(userId: number): Promise<string> {
  const sessionToken = await generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  const newSession: NewSession = {
    userId,
    sessionToken,
    expiresAt,
  };

  try {
    await db.insert(sessions).values(newSession);
    return sessionToken;
  } catch (error) {
    throw new Error(
      `Failed to create session: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Validate a session token and return user data if valid
 *
 * Checks:
 * 1. Session exists in database
 * 2. Session has not expired
 * 3. Associated user exists
 *
 * @param sessionToken - Session token to validate
 * @returns Promise resolving to user data if valid, null otherwise
 */
export async function validateSession(sessionToken: string): Promise<{
  userId: number;
  username: string;
  sessionId: number;
} | null> {
  try {
    const now = new Date();

    // Query session with user data in a single database call
    const result = await db
      .select({
        sessionId: sessions.id,
        userId: sessions.userId,
        expiresAt: sessions.expiresAt,
        username: users.username,
      })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(
        and(
          eq(sessions.sessionToken, sessionToken),
          gt(sessions.expiresAt, now) // Only non-expired sessions
        )
      )
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const session = result[0];

    return {
      userId: session.userId,
      username: session.username,
      sessionId: session.sessionId,
    };
  } catch (error) {
    console.error('Session validation error:', error);
    return null;
  }
}

/**
 * Delete a specific session (logout)
 *
 * @param sessionToken - Session token to delete
 * @returns Promise resolving to true if session was deleted, false otherwise
 */
export async function deleteSession(sessionToken: string): Promise<boolean> {
  try {
    const result = await db
      .delete(sessions)
      .where(eq(sessions.sessionToken, sessionToken))
      .returning({ id: sessions.id });

    return result.length > 0;
  } catch (error) {
    console.error('Session deletion error:', error);
    return false;
  }
}

/**
 * Delete all sessions for a specific user (logout from all devices)
 *
 * @param userId - User ID to delete sessions for
 * @returns Promise resolving to number of sessions deleted
 */
export async function deleteAllUserSessions(userId: number): Promise<number> {
  try {
    const result = await db
      .delete(sessions)
      .where(eq(sessions.userId, userId))
      .returning({ id: sessions.id });

    return result.length;
  } catch (error) {
    console.error('User sessions deletion error:', error);
    return 0;
  }
}

/**
 * Clean up expired sessions from the database
 *
 * Should be run periodically (e.g., via cron job) to prevent
 * database bloat from expired sessions
 *
 * @returns Promise resolving to number of sessions deleted
 */
export async function cleanupExpiredSessions(): Promise<number> {
  try {
    const now = new Date();
    const result = await db
      .delete(sessions)
      .where(lt(sessions.expiresAt, now))
      .returning({ id: sessions.id });

    return result.length;
  } catch (error) {
    console.error('Expired sessions cleanup error:', error);
    return 0;
  }
}
