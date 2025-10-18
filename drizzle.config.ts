import type { Config } from 'drizzle-kit';
import { config } from 'dotenv';

// Load environment variables
config();

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgresql://weekend_user:local_dev_password@localhost:5436/weekend_finder',
  },
  verbose: true,
  strict: true,
} satisfies Config;
