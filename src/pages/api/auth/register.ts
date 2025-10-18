import type { APIRoute } from 'astro';
import { db } from '@/db';
import { users, type NewUser } from '@/db/schema';
import { hashPassword, validatePasswordStrength } from '@/lib/auth/password';
import { createSession, SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS } from '@/lib/auth/session';

/**
 * User registration endpoint
 *
 * POST /api/auth/register
 * Creates a new user account with hashed password and initiates a session
 *
 * Request body:
 * {
 *   "username": string (3-50 characters, alphanumeric + underscore),
 *   "password": string (min 8 chars, must contain letter and number)
 * }
 *
 * Success response (201):
 * {
 *   "success": true,
 *   "userId": number,
 *   "username": string
 * }
 *
 * Error responses:
 * - 400: Invalid input (missing fields, validation failed)
 * - 409: Username already exists
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

    // Validate username format
    const usernameRegex = /^[a-zA-Z0-9_]{3,50}$/;
    if (!usernameRegex.test(username)) {
      return new Response(
        JSON.stringify({
          error: 'Invalid username',
          message:
            'Username must be 3-50 characters long and contain only letters, numbers, and underscores',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return new Response(
        JSON.stringify({
          error: 'Weak password',
          message: passwordValidation.error,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const newUser: NewUser = {
      username,
      passwordHash,
    };

    let userId: number;
    try {
      const result = await db.insert(users).values(newUser).returning({ id: users.id });
      userId = result[0].id;
    } catch (error: unknown) {
      // Check for unique constraint violation (username already exists)
      if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
        return new Response(
          JSON.stringify({
            error: 'Username taken',
            message: 'This username is already registered',
          }),
          {
            status: 409,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      throw error; // Re-throw other errors
    }

    // Create session
    const sessionToken = await createSession(userId);

    // Set session cookie
    cookies.set(SESSION_COOKIE_NAME, sessionToken, SESSION_COOKIE_OPTIONS);

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        userId,
        username,
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return new Response(
      JSON.stringify({
        error: 'Server error',
        message: 'An unexpected error occurred during registration',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
