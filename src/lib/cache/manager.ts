import { db } from '@/db';
import { searchCache } from '@/db/schema';
import { eq, and, gte } from 'drizzle-orm';
import { generateCacheKey } from './keys';
import type { SearchRequest, RecommendationsResponse } from '../search/types';

/**
 * Cache TTL: 48 hours
 */
const CACHE_TTL_MS = 48 * 60 * 60 * 1000;

/**
 * Cost breakdown for search operation
 */
export interface CostBreakdown {
  claudeCost: number; // Cost from Claude API tokens (USD)
  serperCost: number; // Cost from Serper API searches (USD)
  total: number; // Total cost (USD)
}

/**
 * Agent metadata stored with cached results
 */
export interface CacheMetadata {
  promptTokens?: number;
  completionTokens?: number;
  searchCount: number;
  model: string;
  estimatedCost: number; // in USD (for backward compatibility)
  costBreakdown: CostBreakdown; // Detailed breakdown
  executionTimeMs: number;
}

/**
 * Cached search result with metadata
 */
export interface CachedSearchResult {
  id: number;
  recommendations: RecommendationsResponse;
  metadata: CacheMetadata;
  cached: true;
  accessCount: number;
  createdAt: Date;
  expiresAt: Date;
}

/**
 * Get cached search results if available and not expired
 *
 * If found, increments access count and updates last access time.
 *
 * @param params - Search request parameters
 * @param userId - User ID for cache lookup
 * @returns Cached results or null if not found/expired
 */
export async function getCachedSearch(
  params: SearchRequest,
  userId: number
): Promise<CachedSearchResult | null> {
  const cacheKey = generateCacheKey(params, userId);

  const [cached] = await db
    .select()
    .from(searchCache)
    .where(
      and(
        eq(searchCache.cacheKey, cacheKey),
        eq(searchCache.userId, userId),
        gte(searchCache.expiresAt, new Date())
      )
    )
    .limit(1);

  if (!cached) {
    return null;
  }

  // Update access statistics
  await db
    .update(searchCache)
    .set({
      accessCount: cached.accessCount + 1,
      updatedAt: new Date(),
    })
    .where(eq(searchCache.id, cached.id));

  return {
    id: cached.id,
    recommendations: cached.recommendations as RecommendationsResponse,
    metadata: cached.agentMetadata as CacheMetadata,
    cached: true,
    accessCount: cached.accessCount + 1,
    createdAt: cached.createdAt,
    expiresAt: cached.expiresAt,
  };
}

/**
 * Store search results in cache
 *
 * @param params - Search request parameters
 * @param recommendations - Recommendations from Claude Agent
 * @param userId - User ID
 * @param metadata - Agent execution metadata (tokens, cost, timing)
 * @returns Cache ID
 */
export async function storeSearchResults(
  params: SearchRequest,
  recommendations: RecommendationsResponse,
  userId: number,
  metadata: CacheMetadata
): Promise<number> {
  const cacheKey = generateCacheKey(params, userId);
  const expiresAt = new Date(Date.now() + CACHE_TTL_MS);

  // Serialize attendees to text (for database storage)
  const attendeesText = params.attendees
    .map((a) => `${a.role} (${a.age} years)`)
    .join(', ');

  const [inserted] = await db
    .insert(searchCache)
    .values({
      userId,
      cacheKey,
      city: params.city,
      dateRangeStart: params.dateRangeStart,
      dateRangeEnd: params.dateRangeEnd,
      attendees: attendeesText,
      preferences: params.preferences || null,
      recommendations: recommendations as unknown as Record<string, unknown>,
      agentMetadata: metadata as unknown as Record<string, unknown>,
      expiresAt,
      accessCount: 1,
    })
    .returning();

  return inserted.id;
}

/**
 * Calculate estimated cost from token usage with detailed breakdown
 *
 * Claude Haiku 4.5 pricing (as of 2025):
 * - Input: $0.80 per million tokens
 * - Output: $4.00 per million tokens
 *
 * Serper API pricing:
 * - $0.001 per search
 *
 * @param promptTokens - Input tokens used
 * @param completionTokens - Output tokens used
 * @param searchCount - Number of Serper searches
 * @returns Object with total cost and detailed breakdown
 */
export function calculateCost(
  promptTokens: number = 0,
  completionTokens: number = 0,
  searchCount: number = 0
): { total: number; breakdown: CostBreakdown } {
  // Claude Haiku 4.5 pricing
  const INPUT_TOKEN_COST = 0.80 / 1_000_000; // $0.80 per million
  const OUTPUT_TOKEN_COST = 4.00 / 1_000_000; // $4.00 per million

  // Serper API pricing
  const SERPER_SEARCH_COST = 0.001; // $0.001 per search

  const claudeCost =
    promptTokens * INPUT_TOKEN_COST + completionTokens * OUTPUT_TOKEN_COST;
  const serperCost = searchCount * SERPER_SEARCH_COST;
  const total = claudeCost + serperCost;

  return {
    total: Number(total.toFixed(6)),
    breakdown: {
      claudeCost: Number(claudeCost.toFixed(6)),
      serperCost: Number(serperCost.toFixed(6)),
      total: Number(total.toFixed(6)),
    },
  };
}

/**
 * Get user's search history
 *
 * Returns last N searches ordered by creation date (newest first).
 *
 * @param userId - User ID
 * @param limit - Maximum number of results (default: 10)
 * @returns Array of cache entries
 */
export async function getUserSearchHistory(
  userId: number,
  limit: number = 10
) {
  return await db
    .select({
      id: searchCache.id,
      city: searchCache.city,
      dateRangeStart: searchCache.dateRangeStart,
      dateRangeEnd: searchCache.dateRangeEnd,
      attendees: searchCache.attendees,
      preferences: searchCache.preferences,
      createdAt: searchCache.createdAt,
      expiresAt: searchCache.expiresAt,
      accessCount: searchCache.accessCount,
    })
    .from(searchCache)
    .where(eq(searchCache.userId, userId))
    .orderBy(searchCache.createdAt)
    .limit(limit);
}
