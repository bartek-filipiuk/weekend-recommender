import type { APIRoute } from 'astro';
import { deleteSession, SESSION_COOKIE_NAME } from '@/lib/auth/session';

/**
 * User logout endpoint
 *
 * POST /api/auth/logout
 * Deletes the current session and clears the session cookie
 *
 * Success response (200):
 * {
 *   "success": true,
 *   "message": "Logged out successfully"
 * }
 *
 * Note: Returns success even if no session exists to prevent
 * information leakage about session state
 */
export const POST: APIRoute = async ({ cookies }) => {
  try {
    // Get session token from cookie
    const sessionToken = cookies.get(SESSION_COOKIE_NAME)?.value;

    // Delete session from database if it exists
    if (sessionToken) {
      await deleteSession(sessionToken);
    }

    // Clear session cookie
    cookies.delete(SESSION_COOKIE_NAME, {
      path: '/',
    });

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Logged out successfully',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Logout error:', error);

    // Still clear the cookie and return success
    // to prevent information leakage about errors
    cookies.delete(SESSION_COOKIE_NAME, {
      path: '/',
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Logged out successfully',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
