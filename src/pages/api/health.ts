import type { APIRoute } from 'astro';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

/**
 * Health check endpoint
 * Tests database connectivity and returns system status
 */
export const GET: APIRoute = async () => {
  try {
    // Test database connection
    const result = await db.execute(sql`SELECT NOW() as current_time`);
    const currentTime = result[0]?.current_time;

    return new Response(
      JSON.stringify({
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: {
          connected: true,
          serverTime: currentTime,
        },
        environment: import.meta.env.NODE_ENV || process.env.NODE_ENV || 'development',
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        status: 'error',
        timestamp: new Date().toISOString(),
        database: {
          connected: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
};
