import type { APIRoute } from 'astro';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifyPassword } from '@/lib/auth/password';
import { createSession, SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS } from '@/lib/auth/session';

/**
 * User login endpoint
 *
 * POST /api/auth/login
 * Authenticates user credentials and creates a session
 *
 * Request body:
 * {
 *   "username": string,
 *   "password": string
 * }
 *
 * Success response (200):
 * {
 *   "success": true,
 *   "userId": number,
 *   "username": string
 * }
 *
 * Error responses:
 * - 400: Invalid input (missing fields)
 * - 401: Invalid credentials
 * - 500: Server error
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Parse request body
    let body: { username?: string; password?: string };
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({
          error: 'Invalid JSON',
          message: 'Request body must be valid JSON',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const { username, password } = body;

    // Validate required fields
    if (!username || !password) {
      return new Response(
        JSON.stringify({
          error: 'Missing fields',
          message: 'Username and password are required',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Find user by username
    const result = await db
      .select({
        id: users.id,
        username: users.username,
        passwordHash: users.passwordHash,
      })
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    // Dummy hash for timing attack prevention
    // This is a valid Argon2id hash that will always fail verification
    // but takes the same time as verifying a real password
    const DUMMY_HASH =
      '$argon2id$v=19$m=65536,t=3,p=4$c29tZXNhbHQxMjM0NTY3ODkwMTIzNDU2Nzg5MDEy$K7FwDqGwLGHQHdLrJvJlOjDxCvqPvZf4xKx8V7rN5F8';

    // Always perform password verification to prevent timing attacks
    // Use dummy hash if user not found
    const hashToVerify = result.length > 0 ? result[0].passwordHash : DUMMY_HASH;
    const isPasswordValid = await verifyPassword(hashToVerify, password);

    // Check if user exists and password is valid
    if (result.length === 0 || !isPasswordValid) {
      // User not found or invalid password - return generic error
      return new Response(
        JSON.stringify({
          error: 'Invalid credentials',
          message: 'Invalid username or password',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // User authenticated successfully
    const user = result[0];

    // Create session
    const sessionToken = await createSession(user.id);

    // Set session cookie
    cookies.set(SESSION_COOKIE_NAME, sessionToken, SESSION_COOKIE_OPTIONS);

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        userId: user.id,
        username: user.username,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Login error:', error);
    return new Response(
      JSON.stringify({
        error: 'Server error',
        message: 'An unexpected error occurred during login',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
