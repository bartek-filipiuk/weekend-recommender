import type { APIRoute } from 'astro';
import { validateSession, SESSION_COOKIE_NAME } from '@/lib/auth/session';
import {
  getCachedSearch,
  storeSearchResults,
  calculateCost,
  type CacheMetadata,
} from '@/lib/cache/manager';
import { findWeekendActivitiesStreaming } from '@/lib/search/agent';
import type { SearchRequest, AgentStreamEvent } from '@/lib/search/types';

/**
 * Search API endpoint with Server-Sent Events (SSE) streaming
 *
 * POST /api/search
 * Requires authentication (session cookie)
 *
 * Request body:
 * {
 *   city: string,
 *   dateRangeStart: string (ISO date),
 *   dateRangeEnd: string (ISO date),
 *   attendees: [{age: number, role: 'child' | 'adult' | 'infant'}],
 *   preferences?: string
 * }
 *
 * Response:
 * - Always uses SSE (text/event-stream)
 * - Cache hit: Single "complete" event with cached data
 * - Cache miss: Stream of progress events, then "complete" event
 *
 * Events:
 * - data: {"type":"start","message":"..."}
 * - data: {"type":"tool_use","tool":"web_search","input":{...}}
 * - data: {"type":"tool_result","tool":"web_search","result":"..."}
 * - data: {"type":"text_delta","text":"..."}
 * - data: {"type":"complete","recommendations":{...},"metadata":{...},"cached":true/false}
 * - data: {"type":"error","error":"..."}
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  // Validate session
  const sessionToken = cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized', message: 'No session cookie' }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  const sessionData = await validateSession(sessionToken);

  if (!sessionData) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized', message: 'Invalid or expired session' }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Parse and validate request body
  let searchParams: SearchRequest;

  try {
    searchParams = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON', message: 'Request body must be valid JSON' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Validate required fields
  if (
    !searchParams.city ||
    !searchParams.dateRangeStart ||
    !searchParams.dateRangeEnd ||
    !searchParams.attendees ||
    !Array.isArray(searchParams.attendees) ||
    searchParams.attendees.length === 0
  ) {
    return new Response(
      JSON.stringify({
        error: 'Missing required fields',
        message: 'city, dateRangeStart, dateRangeEnd, and attendees[] are required',
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Create SSE stream
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      // Helper to send SSE event
      const sendEvent = (event: Record<string, unknown>) => {
        const data = JSON.stringify(event);
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      };

      try {
        // Check cache
        const cached = await getCachedSearch(searchParams, sessionData.userId);

        if (cached) {
          // Cache hit - send immediate response
          sendEvent({
            type: 'complete',
            recommendations: cached.recommendations,
            metadata: cached.metadata,
            cached: true,
            cacheId: cached.id,
            accessCount: cached.accessCount,
          });

          controller.close();
          return;
        }

        // Cache miss - perform agent search with streaming
        const startTime = Date.now();

        const recommendations = await findWeekendActivitiesStreaming(
          searchParams,
          (event: AgentStreamEvent) => {
            // Forward agent events to SSE stream
            sendEvent(event);
          }
        );

        const executionTimeMs = Date.now() - startTime;

        // Calculate metadata
        const metadata: CacheMetadata = {
          promptTokens: 0, // TODO: Extract from agent response
          completionTokens: 0, // TODO: Extract from agent response
          searchCount: 0, // TODO: Extract from agent response
          model: 'claude-haiku-4-20250213',
          estimatedCost: calculateCost(0, 0, 0), // TODO: Use actual values
          executionTimeMs,
        };

        // Store in cache
        const cacheId = await storeSearchResults(
          searchParams,
          recommendations,
          sessionData.userId,
          metadata
        );

        // Send final complete event
        sendEvent({
          type: 'complete',
          recommendations,
          metadata,
          cached: false,
          cacheId,
        });

        controller.close();
      } catch (error) {
        // Send error event
        sendEvent({
          type: 'error',
          error: error instanceof Error ? error.message : 'Unknown error occurred',
        });

        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  });
};
