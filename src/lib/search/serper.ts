import type { SerperAPIResponse } from './types';

/**
 * Serper API client for Google Search integration
 *
 * Serper.dev provides Google Search API access at $0.001 per search
 * (90% cheaper than Anthropic's built-in web search at $0.01 per search)
 *
 * Free tier: 2,500 searches/month
 * API docs: https://serper.dev/docs
 */

const SERPER_API_URL = 'https://google.serper.dev/search';

/**
 * Serper search parameters
 */
export interface SerperSearchParams {
  q: string; // Search query
  gl?: string; // Geographic location (default: 'pl' for Poland)
  hl?: string; // Language (default: 'pl' for Polish)
  num?: number; // Number of results (default: 10, max: 100)
  page?: number; // Page number for pagination
  autocorrect?: boolean; // Auto-correct spelling
  type?: 'search' | 'images' | 'news' | 'places'; // Search type
}

/**
 * Execute a search query using Serper API
 *
 * @param params - Search parameters
 * @returns Promise resolving to Serper API response
 * @throws Error if API key is missing or request fails
 */
export async function searchWithSerper(
  params: SerperSearchParams
): Promise<SerperAPIResponse> {
  const apiKey = process.env.SERPER_API_KEY || import.meta.env?.SERPER_API_KEY;

  if (!apiKey) {
    throw new Error(
      'SERPER_API_KEY is not configured. Get your free API key at https://serper.dev/'
    );
  }

  // Default parameters optimized for weekend activity search
  const searchParams: SerperSearchParams = {
    gl: 'pl', // Poland
    hl: 'pl', // Polish
    num: 10, // 10 results balances quality vs cost
    autocorrect: true,
    type: 'search',
    ...params, // Allow overrides
  };

  try {
    const response = await fetch(SERPER_API_URL, {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(searchParams),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Serper API error (${response.status}): ${errorText}`
      );
    }

    const data: SerperAPIResponse = await response.json();
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Serper API request failed: ${error.message}`);
    }
    throw new Error('Serper API request failed with unknown error');
  }
}

/**
 * Format Serper search results into text summary for Claude
 *
 * @param results - Serper API response
 * @returns Formatted text string with search results
 */
export function formatSerperResults(results: SerperAPIResponse): string {
  let formatted = `Search Query: ${results.searchParameters.q}\n\n`;

  // Add answer box if available (featured snippet)
  if (results.answerBox) {
    formatted += `📌 Featured Answer:\n`;
    formatted += `${results.answerBox.snippet}\n`;
    formatted += `Source: ${results.answerBox.title} (${results.answerBox.link})\n\n`;
  }

  // Add organic results
  if (results.organic && results.organic.length > 0) {
    formatted += `🔍 Search Results:\n\n`;

    results.organic.forEach((result, index) => {
      formatted += `${index + 1}. ${result.title}\n`;
      formatted += `   ${result.snippet}\n`;
      formatted += `   Link: ${result.link}\n`;
      if (result.date) {
        formatted += `   Date: ${result.date}\n`;
      }
      formatted += `\n`;
    });
  }

  // Add "People Also Ask" if available
  if (results.peopleAlsoAsk && results.peopleAlsoAsk.length > 0) {
    formatted += `❓ People Also Ask:\n\n`;

    results.peopleAlsoAsk.forEach((item, index) => {
      formatted += `${index + 1}. ${item.question}\n`;
      formatted += `   ${item.snippet}\n\n`;
    });
  }

  return formatted;
}

/**
 * Serper tool definition for Claude Agent
 *
 * This defines the web_search tool that Claude can use
 * to search for weekend activities
 */
export const SERPER_TOOL_DEFINITION = {
  name: 'web_search',
  description: `Search Google for information about weekend activities, attractions, and events.
Use this tool to find:
- Indoor play areas and activity centers
- Museums, galleries, and cultural venues
- Outdoor activities (parks, trails, playgrounds)
- Family-friendly restaurants and cafes
- Special events and workshops
- Opening hours, prices, and contact information

Best practices:
- Use specific location queries (e.g., "indoor playground Wrocław")
- Include age-appropriate keywords (e.g., "activities for 5 year old")
- Search in Polish for better local results (e.g., "sale zabaw dla dzieci Wrocław")
- Make multiple searches to get comprehensive results`,
  input_schema: {
    type: 'object' as const,
    properties: {
      query: {
        type: 'string',
        description:
          'The search query. Can be in Polish or English. Be specific about location and activity type.',
      },
      num_results: {
        type: 'number',
        description:
          'Number of results to return (default: 10, max: 100). Use higher numbers for broader searches.',
        default: 10,
      },
    },
    required: ['query'],
  },
};

/**
 * Execute web search tool (called by Claude Agent)
 *
 * @param input - Tool input from Claude (contains query and optional num_results)
 * @returns Formatted search results as string
 */
export async function executeWebSearchTool(input: {
  query: string;
  num_results?: number;
}): Promise<string> {
  const results = await searchWithSerper({
    q: input.query,
    num: input.num_results || 10,
  });

  return formatSerperResults(results);
}
