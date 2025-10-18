import type { APIRoute } from 'astro';
import { getAuthenticatedUser } from '@/lib/auth/middleware';

/**
 * Authentication status endpoint
 *
 * GET /api/auth/status
 * Returns current authentication status and user information
 *
 * Success response (200):
 * When authenticated:
 * {
 *   "authenticated": true,
 *   "user": {
 *     "userId": number,
 *     "username": string
 *   }
 * }
 *
 * When not authenticated:
 * {
 *   "authenticated": false
 * }
 */
export const GET: APIRoute = async (context) => {
  try {
    const user = await getAuthenticatedUser(context);

    if (!user) {
      return new Response(
        JSON.stringify({
          authenticated: false,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        authenticated: true,
        user: {
          userId: user.userId,
          username: user.username,
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Auth status error:', error);
    return new Response(
      JSON.stringify({
        authenticated: false,
        error: 'Failed to check authentication status',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
