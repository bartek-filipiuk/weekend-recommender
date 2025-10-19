import type { APIContext } from 'astro';
import { validateSession, SESSION_COOKIE_NAME } from './session';

/**
 * Authentication middleware for API routes and pages
 *
 * Provides utilities to check if a request is authenticated
 * and extract user information from session cookies
 */

/**
 * Authenticated user data extracted from valid session
 */
export interface AuthenticatedUser {
  userId: number;
  username: string;
  sessionId: number;
  role: 'user' | 'admin';
}

/**
 * Get authenticated user from request cookies
 *
 * Validates session token from cookie and returns user data if valid
 *
 * @param context - Astro API context with cookies
 * @returns Promise resolving to user data if authenticated, null otherwise
 */
export async function getAuthenticatedUser(
  context: APIContext
): Promise<AuthenticatedUser | null> {
  const sessionToken = context.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) {
    return null;
  }

  return await validateSession(sessionToken);
}

/**
 * Require authentication for an API route
 *
 * Returns authenticated user data if session is valid,
 * otherwise returns 401 Unauthorized response
 *
 * Usage in API routes:
 * ```ts
 * export const GET: APIRoute = async (context) => {
 *   const user = await requireAuth(context);
 *   if (user instanceof Response) return user; // 401 error
 *
 *   // User is authenticated, proceed with request
 *   return new Response(JSON.stringify({ userId: user.userId }));
 * };
 * ```
 *
 * @param context - Astro API context
 * @returns Promise resolving to authenticated user data or 401 Response
 */
export async function requireAuth(
  context: APIContext
): Promise<AuthenticatedUser | Response> {
  const user = await getAuthenticatedUser(context);

  if (!user) {
    return new Response(
      JSON.stringify({
        error: 'Unauthorized',
        message: 'You must be logged in to access this resource',
      }),
      {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }

  return user;
}

/**
 * Check if a request is authenticated (for pages)
 *
 * Use in Astro pages to conditionally render content or redirect
 *
 * Usage in .astro pages:
 * ```astro
 * ---
 * import { isAuthenticated } from '@/lib/auth/middleware';
 *
 * const user = await isAuthenticated(Astro);
 * if (!user) {
 *   return Astro.redirect('/login');
 * }
 * ---
 * <h1>Welcome, {user.username}!</h1>
 * ```
 *
 * @param context - Astro context
 * @returns Promise resolving to user data if authenticated, null otherwise
 */
export async function isAuthenticated(
  context: APIContext
): Promise<AuthenticatedUser | null> {
  return await getAuthenticatedUser(context);
}

/**
 * Require admin role for an API route
 *
 * Returns authenticated admin user data if session is valid and user is admin,
 * otherwise returns 401 Unauthorized or 403 Forbidden response
 *
 * Usage in API routes:
 * ```ts
 * export const GET: APIRoute = async (context) => {
 *   const admin = await requireAdmin(context);
 *   if (admin instanceof Response) return admin; // 401/403 error
 *
 *   // User is admin, proceed with request
 *   return new Response(JSON.stringify({ message: 'Admin access granted' }));
 * };
 * ```
 *
 * @param context - Astro API context
 * @returns Promise resolving to authenticated admin user data or error Response
 */
export async function requireAdmin(
  context: APIContext
): Promise<AuthenticatedUser | Response> {
  const user = await getAuthenticatedUser(context);

  if (!user) {
    return new Response(
      JSON.stringify({
        error: 'Unauthorized',
        message: 'You must be logged in to access this resource',
      }),
      {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }

  if (user.role !== 'admin') {
    return new Response(
      JSON.stringify({
        error: 'Forbidden',
        message: 'Admin access required',
      }),
      {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }

  return user;
}
