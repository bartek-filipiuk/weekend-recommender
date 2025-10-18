import type { APIRoute } from 'astro';
import { validateSession, SESSION_COOKIE_NAME } from '@/lib/auth/session';
import { getUserSearchHistory } from '@/lib/cache/manager';

/**
 * Search History API endpoint
 *
 * GET /api/history
 * Requires authentication (session cookie)
 *
 * Query parameters:
 * - limit: number (optional, default: 10, max: 50)
 *
 * Response:
 * {
 *   history: [
 *     {
 *       id: number,
 *       city: string,
 *       dateRangeStart: string,
 *       dateRangeEnd: string,
 *       attendees: string,
 *       preferences: string | null,
 *       createdAt: string,
 *       expiresAt: string,
 *       accessCount: number,
 *       isExpired: boolean
 *     }
 *   ]
 * }
 */
export const GET: APIRoute = async ({ cookies, url }) => {
  // Validate session
  const sessionToken = cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized', message: 'No session cookie' }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  const sessionData = await validateSession(sessionToken);

  if (!sessionData) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized', message: 'Invalid or expired session' }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Get limit from query params
  const limitParam = url.searchParams.get('limit');
  let limit = 10;

  if (limitParam) {
    const parsed = parseInt(limitParam, 10);
    if (!isNaN(parsed) && parsed > 0 && parsed <= 50) {
      limit = parsed;
    }
  }

  // Fetch search history
  const history = await getUserSearchHistory(sessionData.userId, limit);

  // Add isExpired flag for each entry
  const now = new Date();
  const enrichedHistory = history.map((entry) => ({
    ...entry,
    isExpired: entry.expiresAt < now,
  }));

  return new Response(
    JSON.stringify({ history: enrichedHistory }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
};
