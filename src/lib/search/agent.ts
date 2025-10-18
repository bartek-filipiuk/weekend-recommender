import Anthropic from '@anthropic-ai/sdk';
import type {
  SearchRequest,
  RecommendationsResponse,
  AgentStreamEvent,
} from './types';
import {
  SERPER_TOOL_DEFINITION,
  executeWebSearchTool,
} from './serper';

/**
 * Claude Agent for Weekend Activity Recommendations
 *
 * Uses Claude Haiku 4.5 with Serper API tool to find and recommend
 * weekend activities for families with children.
 *
 * Cost per search (estimated):
 * - Claude Haiku 4.5: ~$0.009 (2000 input tokens + 1500 output tokens)
 * - Serper API: ~$0.004 (4 searches average)
 * - Total: ~$0.013 per search request
 */

const CLAUDE_MODEL = 'claude-haiku-4-20250213'; // Haiku 4.5
const MAX_TOKENS = 4096; // Maximum tokens for response
const TEMPERATURE = 1.0; // Creativity level (1.0 = default)

/**
 * System prompt for Claude Agent
 *
 * Defines the agent's role, capabilities, and output format
 */
const SYSTEM_PROMPT = `You are a helpful weekend activity finder for families with children in Poland.

Your role:
- Help parents discover engaging, age-appropriate activities for their children
- Search for activities using the web_search tool
- Provide personalized recommendations based on preferences and attendee ages
- Include practical information (prices, hours, location, contact)

Guidelines:
- Make multiple searches to find diverse options (indoor, outdoor, cultural, active)
- Prioritize safety, age-appropriateness, and family-friendliness
- Include a mix of free and paid activities when possible
- Provide clear, actionable information
- If information is missing, say so (don't make up details)
- Search in Polish for better local results (e.g., "sale zabaw Wrocław")

Output format:
Return a JSON object with this exact structure:
{
  "searchSummary": "Brief summary of what you searched for and found",
  "recommendations": [
    {
      "name": "Activity Name",
      "description": "Detailed description of the activity",
      "category": "Indoor Play" | "Outdoor" | "Museum" | "Sports" | "Workshop" | etc,
      "ageRange": "e.g., 3-8 years",
      "location": {
        "address": "Full address",
        "city": "City name",
        "mapLink": "Google Maps link if available"
      },
      "pricing": {
        "type": "free" | "paid" | "donation",
        "amount": "Price in PLN if paid",
        "details": "Additional pricing details"
      },
      "openingHours": "Opening hours",
      "website": "Website URL if available",
      "phoneNumber": "Phone number if available",
      "rating": Optional number 1-5,
      "whyRecommended": "Why this is good for this specific family",
      "tips": ["Helpful tip 1", "Helpful tip 2"]
    }
  ],
  "additionalNotes": "Important notes or warnings",
  "searchDate": "${new Date().toISOString()}"
}`;

/**
 * Initialize Anthropic client
 */
function getAnthropicClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY || import.meta.env?.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error(
      'ANTHROPIC_API_KEY is not configured. Get your API key at https://console.anthropic.com/'
    );
  }

  return new Anthropic({
    apiKey,
  });
}

/**
 * Generate user prompt from search request
 *
 * @param request - Search request parameters
 * @returns Formatted prompt for Claude
 */
function generateUserPrompt(request: SearchRequest): string {
  const { city, dateRangeStart, dateRangeEnd, attendees, preferences } = request;

  // Format dates
  const startDate = new Date(dateRangeStart).toLocaleDateString('pl-PL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const endDate = new Date(dateRangeEnd).toLocaleDateString('pl-PL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Format attendees
  const attendeesList = attendees
    .map((a) => `${a.role} (${a.age} years old)`)
    .join(', ');

  let prompt = `Find weekend activities in ${city} for ${startDate} to ${endDate}.\n\n`;
  prompt += `Attendees: ${attendeesList}\n\n`;

  if (preferences) {
    prompt += `Preferences: ${preferences}\n\n`;
  }

  prompt += `Please search for various activities and provide 5-7 diverse recommendations.`;
  prompt += ` Include a mix of different categories and price points.`;
  prompt += ` Make sure all recommendations are appropriate for the ages listed.`;
  prompt += `\n\nIMPORTANT: Return your final response as a valid JSON object matching the specified format.`;

  return prompt;
}

/**
 * Search for weekend activities using Claude Agent
 *
 * This function orchestrates the agent loop:
 * 1. Send initial request to Claude with tools
 * 2. If Claude uses web_search tool, execute it and send results back
 * 3. Repeat until Claude returns final recommendations
 * 4. Parse and return structured response
 *
 * @param request - Search request parameters
 * @returns Promise resolving to recommendations
 */
export async function findWeekendActivities(
  request: SearchRequest
): Promise<RecommendationsResponse> {
  const client = getAnthropicClient();
  const userPrompt = generateUserPrompt(request);

  let messages: Anthropic.Messages.MessageParam[] = [
    {
      role: 'user',
      content: userPrompt,
    },
  ];

  // Agent loop: keep calling Claude until it returns a text response (not tool use)
  let maxIterations = 10; // Prevent infinite loops
  let iteration = 0;

  while (iteration < maxIterations) {
    iteration++;

    const response = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: MAX_TOKENS,
      temperature: TEMPERATURE,
      system: SYSTEM_PROMPT,
      messages,
      tools: [SERPER_TOOL_DEFINITION],
    });

    // Check if Claude wants to use a tool
    const toolUseBlock = response.content.find(
      (block): block is Anthropic.Messages.ToolUseBlock =>
        block.type === 'tool_use'
    );

    if (toolUseBlock) {
      // Claude wants to use the web_search tool
      console.log(`[Agent] Tool use: ${toolUseBlock.name}`, toolUseBlock.input);

      // Execute the tool
      let toolResult: string;
      try {
        toolResult = await executeWebSearchTool(
          toolUseBlock.input as { query: string; num_results?: number }
        );
      } catch (error) {
        toolResult = `Error executing search: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`;
      }

      // Add assistant's response (with tool use) to messages
      messages.push({
        role: 'assistant',
        content: response.content,
      });

      // Add tool result to messages
      messages.push({
        role: 'user',
        content: [
          {
            type: 'tool_result',
            tool_use_id: toolUseBlock.id,
            content: toolResult,
          },
        ],
      });

      // Continue the loop to get Claude's next response
      continue;
    }

    // Claude returned a text response (final answer)
    const textBlock = response.content.find(
      (block): block is Anthropic.Messages.TextBlock => block.type === 'text'
    );

    if (textBlock) {
      // Parse JSON response
      try {
        // Extract JSON from response (might be wrapped in markdown code blocks)
        let jsonText = textBlock.text;

        // Remove markdown code blocks if present
        const jsonMatch = jsonText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
        if (jsonMatch) {
          jsonText = jsonMatch[1];
        }

        const recommendations: RecommendationsResponse = JSON.parse(jsonText);
        return recommendations;
      } catch (error) {
        throw new Error(
          `Failed to parse Claude's response as JSON: ${
            error instanceof Error ? error.message : 'Unknown error'
          }\n\nResponse: ${textBlock.text}`
        );
      }
    }

    throw new Error('Claude returned unexpected response format');
  }

  throw new Error(
    `Agent exceeded maximum iterations (${maxIterations}). This might indicate an issue with tool calling.`
  );
}

/**
 * Search for weekend activities with streaming support
 *
 * Streams agent events in real-time for better UX
 *
 * @param request - Search request parameters
 * @param onEvent - Callback for streaming events
 * @returns Promise resolving to final recommendations
 */
export async function findWeekendActivitiesStreaming(
  request: SearchRequest,
  onEvent: (event: AgentStreamEvent) => void
): Promise<RecommendationsResponse> {
  const client = getAnthropicClient();
  const userPrompt = generateUserPrompt(request);

  onEvent({ type: 'start', message: 'Starting activity search...' });

  let messages: Anthropic.Messages.MessageParam[] = [
    {
      role: 'user',
      content: userPrompt,
    },
  ];

  let maxIterations = 10;
  let iteration = 0;

  while (iteration < maxIterations) {
    iteration++;

    const response = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: MAX_TOKENS,
      temperature: TEMPERATURE,
      system: SYSTEM_PROMPT,
      messages,
      tools: [SERPER_TOOL_DEFINITION],
    });

    const toolUseBlock = response.content.find(
      (block): block is Anthropic.Messages.ToolUseBlock =>
        block.type === 'tool_use'
    );

    if (toolUseBlock) {
      onEvent({
        type: 'tool_use',
        tool: toolUseBlock.name,
        input: toolUseBlock.input as Record<string, unknown>,
      });

      let toolResult: string;
      try {
        toolResult = await executeWebSearchTool(
          toolUseBlock.input as { query: string; num_results?: number }
        );
        onEvent({
          type: 'tool_result',
          tool: toolUseBlock.name,
          result: `Found ${toolResult.split('\n').length} lines of results`,
        });
      } catch (error) {
        toolResult = `Error: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`;
        onEvent({ type: 'error', error: toolResult });
      }

      messages.push({
        role: 'assistant',
        content: response.content,
      });

      messages.push({
        role: 'user',
        content: [
          {
            type: 'tool_result',
            tool_use_id: toolUseBlock.id,
            content: toolResult,
          },
        ],
      });

      continue;
    }

    const textBlock = response.content.find(
      (block): block is Anthropic.Messages.TextBlock => block.type === 'text'
    );

    if (textBlock) {
      onEvent({ type: 'text_delta', text: 'Processing recommendations...' });

      try {
        let jsonText = textBlock.text;
        const jsonMatch = jsonText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
        if (jsonMatch) {
          jsonText = jsonMatch[1];
        }

        const recommendations: RecommendationsResponse = JSON.parse(jsonText);
        onEvent({ type: 'complete', recommendations });
        return recommendations;
      } catch (error) {
        const errorMsg = `Failed to parse response: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`;
        onEvent({ type: 'error', error: errorMsg });
        throw new Error(errorMsg);
      }
    }

    throw new Error('Unexpected response format');
  }

  const errorMsg = `Agent exceeded max iterations (${maxIterations})`;
  onEvent({ type: 'error', error: errorMsg });
  throw new Error(errorMsg);
}
