/**
 * Type definitions for search infrastructure
 *
 * Defines interfaces for Serper API responses, Claude Agent interactions,
 * and structured activity recommendations
 */

/**
 * Attendee information for activity search
 */
export interface Attendee {
  age: number;
  role: 'child' | 'adult' | 'infant';
}

/**
 * Search request parameters
 */
export interface SearchRequest {
  city: string;
  dateRangeStart: string; // ISO date string
  dateRangeEnd: string; // ISO date string
  attendees: Attendee[];
  preferences?: string; // Optional user preferences (e.g., "outdoor activities, museums")
}

/**
 * Serper API search result item
 */
export interface SerperSearchResult {
  title: string;
  link: string;
  snippet: string;
  position: number;
  date?: string;
}

/**
 * Serper API response structure
 */
export interface SerperAPIResponse {
  searchParameters: {
    q: string;
    gl?: string;
    hl?: string;
    num?: number;
  };
  organic: SerperSearchResult[];
  answerBox?: {
    snippet: string;
    title: string;
    link: string;
  };
  peopleAlsoAsk?: Array<{
    question: string;
    snippet: string;
    title: string;
    link: string;
  }>;
}

/**
 * Activity recommendation from Claude Agent
 */
export interface ActivityRecommendation {
  name: string;
  description: string;
  category: string; // e.g., "Indoor Play", "Museum", "Outdoor Activity"
  ageRange: string; // e.g., "3-10 years"
  location: {
    address: string;
    city: string;
    mapLink?: string;
  };
  pricing: {
    type: 'free' | 'paid' | 'donation';
    amount?: string; // e.g., "25 PLN per child"
    details?: string;
  };
  openingHours?: string; // e.g., "Mon-Fri: 9:00-18:00"
  website?: string;
  phoneNumber?: string;
  rating?: number; // 1-5 stars
  whyRecommended: string; // Personalized explanation
  tips?: string[]; // Additional tips
}

/**
 * Structured recommendations response from Claude
 */
export interface RecommendationsResponse {
  searchSummary: string; // Brief summary of search performed
  recommendations: ActivityRecommendation[];
  additionalNotes?: string; // Any important notes or warnings
  searchDate: string; // ISO timestamp
}

/**
 * Agent tool definition (for Claude function calling)
 */
export interface AgentTool {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

/**
 * Agent message content
 */
export type AgentMessageContent =
  | { type: 'text'; text: string }
  | {
      type: 'tool_use';
      id: string;
      name: string;
      input: Record<string, unknown>;
    }
  | {
      type: 'tool_result';
      tool_use_id: string;
      content: string;
    };

/**
 * Agent message
 */
export interface AgentMessage {
  role: 'user' | 'assistant';
  content: AgentMessageContent[] | string;
}

/**
 * Agent streaming event types
 */
export type AgentStreamEvent =
  | { type: 'start'; message: string }
  | { type: 'tool_use'; tool: string; input: Record<string, unknown> }
  | { type: 'tool_result'; tool: string; result: string }
  | { type: 'text_delta'; text: string }
  | { type: 'thinking'; text: string }
  | { type: 'complete'; recommendations: RecommendationsResponse }
  | { type: 'error'; error: string };
