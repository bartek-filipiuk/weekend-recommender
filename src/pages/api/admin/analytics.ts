import type { APIRoute } from 'astro';
import { requireAdmin } from '@/lib/auth/middleware';
import { db } from '@/db';
import { searchCache, users } from '@/db/schema';
import { sql, desc, eq } from 'drizzle-orm';
import type { CacheMetadata } from '@/lib/cache/manager';

/**
 * Admin Analytics API
 *
 * GET /api/admin/analytics
 * Returns:
 * - Total searches count
 * - Total users count
 * - Total cost (sum of all search costs)
 * - Recent searches with pagination
 *
 * Query parameters:
 * - page: Page number (default: 1)
 * - limit: Results per page (default: 20, max: 100)
 *
 * Requires admin authentication
 */
export const GET: APIRoute = async (context) => {
  // Require admin access
  const admin = await requireAdmin(context);
  if (admin instanceof Response) return admin;

  // Parse query parameters
  const url = new URL(context.request.url);
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '20', 10)));
  const offset = (page - 1) * limit;

  try {
    // Get total counts
    const [stats] = await db
      .select({
        totalSearches: sql<number>`COUNT(DISTINCT ${searchCache.id})`.as('total_searches'),
        totalUsers: sql<number>`COUNT(DISTINCT ${users.id})`.as('total_users'),
      })
      .from(searchCache)
      .leftJoin(users, eq(searchCache.userId, users.id));

    // Get all searches to calculate total cost
    const allSearches = await db
      .select({
        agentMetadata: searchCache.agentMetadata,
      })
      .from(searchCache);

    // Calculate total cost
    let totalCost = 0;
    for (const search of allSearches) {
      const metadata = search.agentMetadata as CacheMetadata | null;
      if (metadata?.estimatedCost) {
        totalCost += metadata.estimatedCost;
      }
    }

    // Get recent searches with pagination
    const recentSearches = await db
      .select({
        id: searchCache.id,
        city: searchCache.city,
        dateRangeStart: searchCache.dateRangeStart,
        dateRangeEnd: searchCache.dateRangeEnd,
        attendees: searchCache.attendees,
        preferences: searchCache.preferences,
        createdAt: searchCache.createdAt,
        accessCount: searchCache.accessCount,
        agentMetadata: searchCache.agentMetadata,
        userId: searchCache.userId,
        username: users.username,
      })
      .from(searchCache)
      .leftJoin(users, eq(searchCache.userId, users.id))
      .orderBy(desc(searchCache.createdAt))
      .limit(limit)
      .offset(offset);

    // Format recent searches
    const formattedSearches = recentSearches.map((search) => {
      const metadata = search.agentMetadata as CacheMetadata | null;
      return {
        id: search.id,
        city: search.city,
        dateRange: {
          start: search.dateRangeStart,
          end: search.dateRangeEnd,
        },
        attendees: search.attendees,
        preferences: search.preferences,
        user: {
          id: search.userId,
          username: search.username,
        },
        cost: metadata?.estimatedCost || 0,
        costBreakdown: metadata?.costBreakdown || null,
        executionTime: metadata?.executionTimeMs || 0,
        model: metadata?.model || 'unknown',
        searchCount: metadata?.searchCount || 0,
        accessCount: search.accessCount,
        createdAt: search.createdAt,
      };
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil((stats.totalSearches || 0) / limit);

    return new Response(
      JSON.stringify({
        stats: {
          totalSearches: stats.totalSearches || 0,
          totalUsers: stats.totalUsers || 0,
          totalCost: Number(totalCost.toFixed(6)),
        },
        searches: formattedSearches,
        pagination: {
          page,
          limit,
          totalPages,
          totalResults: stats.totalSearches || 0,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Analytics API error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        message: 'Failed to fetch analytics data',
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
