import crypto from 'crypto';
import type { SearchRequest } from '../search/types';

/**
 * Generate a consistent cache key from search parameters
 *
 * The cache key is a SHA-256 hash of normalized search parameters.
 * This ensures identical searches produce the same cache key.
 *
 * @param params - Search request parameters
 * @returns SHA-256 hash (64-character hex string)
 */
export function generateCacheKey(params: SearchRequest): string {
  // Normalize parameters for consistent hashing
  const normalized = {
    // Normalize city (lowercase, trim)
    city: params.city.toLowerCase().trim(),

    // Dates (already ISO strings, just ensure consistency)
    dateRangeStart: params.dateRangeStart,
    dateRangeEnd: params.dateRangeEnd,

    // Normalize attendees array (sort by age for consistency)
    attendees: params.attendees
      .map((a) => ({
        age: a.age,
        role: a.role.toLowerCase(),
      }))
      .sort((a, b) => a.age - b.age),

    // Normalize preferences (lowercase, trim, empty string if undefined)
    preferences: (params.preferences || '').toLowerCase().trim(),
  };

  // Serialize to deterministic JSON string
  const serialized = JSON.stringify(normalized);

  // Generate SHA-256 hash
  return crypto.createHash('sha256').update(serialized, 'utf8').digest('hex');
}

/**
 * Validate cache key format
 *
 * @param key - Cache key to validate
 * @returns true if valid SHA-256 hex string (64 characters)
 */
export function isValidCacheKey(key: string): boolean {
  return /^[a-f0-9]{64}$/.test(key);
}
