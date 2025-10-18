import { pgTable, serial, varchar, timestamp, text, integer, jsonb, date, index } from 'drizzle-orm/pg-core';

/**
 * Users table - stores user authentication data
 */
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  usernameIdx: index('username_idx').on(table.username),
}));

/**
 * Sessions table - stores active user sessions
 */
export const sessions = pgTable('sessions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  sessionToken: varchar('session_token', { length: 255 }).notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('session_user_id_idx').on(table.userId),
  sessionTokenIdx: index('session_token_idx').on(table.sessionToken),
  expiresAtIdx: index('session_expires_at_idx').on(table.expiresAt),
}));

/**
 * Search cache table - stores cached search results
 */
export const searchCache = pgTable('search_cache', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  cacheKey: varchar('cache_key', { length: 64 }).notNull().unique(),
  city: varchar('city', { length: 100 }).notNull(),
  dateRangeStart: date('date_range_start').notNull(),
  dateRangeEnd: date('date_range_end').notNull(),
  attendees: text('attendees').notNull(), // JSON string of attendees array
  preferences: text('preferences'), // Optional user preferences
  recommendations: jsonb('recommendations').notNull(), // Structured JSON of results
  agentMetadata: jsonb('agent_metadata'), // Optional metadata from Claude Agent
  expiresAt: timestamp('expires_at').notNull(),
  accessCount: integer('access_count').notNull().default(1),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('cache_user_id_idx').on(table.userId),
  cacheKeyIdx: index('cache_key_idx').on(table.cacheKey),
  expiresAtIdx: index('cache_expires_at_idx').on(table.expiresAt),
  cityDateIdx: index('cache_city_date_idx').on(table.city, table.dateRangeStart),
}));

/**
 * TypeScript types derived from schema
 */
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

export type SearchCache = typeof searchCache.$inferSelect;
export type NewSearchCache = typeof searchCache.$inferInsert;
