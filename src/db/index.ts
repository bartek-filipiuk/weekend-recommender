import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { config } from 'dotenv';

/**
 * Database connection configuration
 *
 * In development: Connects to Docker PostgreSQL
 * In production: Connects to managed database (e.g., DigitalOcean)
 */

// Load .env if in Node.js environment (for migrations)
if (typeof process !== 'undefined' && !process.env.DATABASE_URL) {
  config();
}

// Get database URL from environment variables
// In Node.js (migrations): process.env
// In Astro runtime: import.meta.env
const DATABASE_URL = process.env.DATABASE_URL || (typeof import.meta.env !== 'undefined' ? import.meta.env.DATABASE_URL : undefined);

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Create PostgreSQL connection
// For migrations: { max: 1 }
// For queries: default connection pool
const connectionString = DATABASE_URL;

// Query client (for application use)
export const queryClient = postgres(connectionString, {
  max: 10, // Connection pool size
  idle_timeout: 20,
  connect_timeout: 10,
});

// Migration client (single connection)
export const migrationClient = postgres(connectionString, {
  max: 1,
});

// Drizzle ORM instances
export const db = drizzle(queryClient, { schema });
export const migrationDb = drizzle(migrationClient, { schema });

/**
 * Helper to close database connections
 * Useful for cleanup in scripts and tests
 */
export async function closeConnections(): Promise<void> {
  await queryClient.end();
  await migrationClient.end();
}
