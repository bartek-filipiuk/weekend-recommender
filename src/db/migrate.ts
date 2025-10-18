/**
 * Database migration script
 *
 * Runs all pending migrations from the drizzle directory
 * Usage: npm run db:migrate
 */

// Load environment variables FIRST before any imports
import { config } from 'dotenv';
config();

// Now import database modules
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { migrationDb, closeConnections } from './index';

async function main() {
  console.log('🔄 Running database migrations...');

  try {
    await migrate(migrationDb, {
      migrationsFolder: './drizzle',
    });

    console.log('✅ Migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await closeConnections();
  }
}

main();
