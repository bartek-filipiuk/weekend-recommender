
# Product Requirements Document (PRD)
## Weekend Activity Finder - AI-Powered Recommendations

**Version:** 1.1.0 (MVP)
**Last Updated:** October 18, 2025
**Author:** Product Team
**Status:** Draft - Updated with Serper API integration

---

## 1. Executive Summary

### 1.1 Product Vision
An AI-powered web application that helps users discover personalized weekend activities and events in their city by leveraging Claude's Agent SDK to search the web and provide intelligent, context-aware recommendations.

### 1.2 Problem Statement
Finding relevant, age-appropriate, and preference-matched activities for groups (especially families with children) requires significant research time across multiple sources. Current solutions lack personalization and context-aware filtering.

### 1.3 Solution Overview
A simple, extensible web application where users input their preferences (who's attending, city, interests) and receive curated recommendations powered by Claude's AI agent performing real-time web searches and intelligent analysis.

---

## 2. Product Goals & Success Metrics

### 2.1 MVP Goals
- ✅ Enable users to search for activities with custom preferences
- ✅ Provide 3-5 high-quality, ranked recommendations per search
- ✅ Cache search results for 24-48 hours to reduce API costs
- ✅ Implement basic user authentication and session management
- ✅ Demonstrate real-time search progress to users

### 2.2 Success Metrics (Post-MVP)
- User engagement: Average 2+ searches per session
- Result quality: User satisfaction survey (future)
- Performance: Search results delivered in <30 seconds
- Cost efficiency: Cache hit rate >40%

---

## 3. User Personas

### Primary Persona: "Family Planner Maria"
- **Age:** 32-45
- **Role:** Parent planning weekend activities
- **Pain Points:**
  - Limited time to research activities
  - Needs age-appropriate options for children
  - Wants to avoid crowded/tourist traps
- **Goals:** Find 2-3 unique activities quickly

### Secondary Persona: "Active Explorer Tom"
- **Age:** 25-35
- **Role:** Young professional seeking local experiences
- **Pain Points:**
  - Discovers activities too late
  - Generic recommendations don't match interests
- **Goals:** Find hidden gems and active pursuits

---

## 4. Functional Requirements

### 4.1 User Authentication & Management

#### 4.1.1 User Registration
- **FR-AUTH-01:** Users can create accounts with username and password
- **FR-AUTH-02:** System validates unique usernames
- **FR-AUTH-03:** Passwords must be hashed (bcrypt/argon2)
- **FR-AUTH-04:** Email field included in database schema (optional for MVP, required for future)

#### 4.1.2 Session Management
- **FR-AUTH-05:** Sessions stored in PostgreSQL with expiry (7 days default)
- **FR-AUTH-06:** Auto-logout after 7 days of inactivity
- **FR-AUTH-07:** Users can manually logout

#### 4.1.3 Authorization
- **FR-AUTH-08:** Only authenticated users can create searches
- **FR-AUTH-09:** Users can only view their own search history

### 4.2 Search & Recommendations

#### 4.2.1 Search Input Form
- **FR-SEARCH-01:** Form fields:
  - City (required, text input)
  - Date range (required, date picker - default: upcoming weekend)
  - Who will attend (required, free-form text field)
    - Examples: "me, wife, 5yo son", "2 adults, 1 child age 5", "family with active kid"
  - Additional preferences (optional, textarea)
    - Examples: "likes climbing, avoid zoo", "indoor activities", "budget-friendly"

#### 4.2.2 Agent SDK Integration
- **FR-SEARCH-02:** System calls Claude Agent SDK from backend (Astro server endpoint)
- **FR-SEARCH-03:** Agent performs web searches based on user preferences
- **FR-SEARCH-04:** Agent analyzes and ranks results (top 3-5 recommendations)
- **FR-SEARCH-05:** Agent response includes:
  - Activity name
  - Description (2-3 sentences)
  - Address/location
  - Estimated cost (if available)
  - Age appropriateness
  - Ranking score explanation

#### 4.2.3 Real-Time Progress Updates
- **FR-SEARCH-06:** Backend streams Agent SDK progress via Server-Sent Events (SSE)
- **FR-SEARCH-07:** Frontend displays progress indicators:
  - "Searching web for events..."
  - "Analyzing results..."
  - "Ranking recommendations..."
- **FR-SEARCH-08:** Timeout: 60 seconds max (display error if exceeded)

#### 4.2.4 Results Display
- **FR-SEARCH-09:** Display recommendations as ranked cards (1-5)
- **FR-SEARCH-10:** Each card shows:
  - Rank badge (#1, #2, #3)
  - Activity name (heading)
  - Description
  - Location
  - Why it's recommended (AI reasoning)
- **FR-SEARCH-11:** Copy button to copy all recommendations to clipboard
- **FR-SEARCH-12:** Results persist on page refresh (fetched from cache)

### 4.3 Caching & Storage

#### 4.3.1 Search Result Caching
- **FR-CACHE-01:** Store search queries + AI results in PostgreSQL
- **FR-CACHE-02:** Cache TTL: 24-48 hours
- **FR-CACHE-03:** Cache key: hash of (city + date_range + attendees + preferences)
- **FR-CACHE-04:** If cache hit within TTL, return cached results (no new API call)
- **FR-CACHE-05:** Cache cleanup: Daily cron job removes expired entries

#### 4.3.2 Search History
- **FR-CACHE-06:** Users can view their search history (last 10 searches)
- **FR-CACHE-07:** History shows: date, city, attendees summary, result count
- **FR-CACHE-08:** Clicking history entry loads cached results (if not expired)

---

## 5. Non-Functional Requirements

### 5.1 Performance
- **NFR-PERF-01:** Page load time: <2 seconds
- **NFR-PERF-02:** Search results: <30 seconds (with streaming updates)
- **NFR-PERF-03:** Support 50 concurrent users (MVP scale)

### 5.2 Security
- **NFR-SEC-01:** HTTPS only (enforce SSL)
- **NFR-SEC-02:** API keys stored in environment variables (never in code)
- **NFR-SEC-03:** SQL injection prevention (use parameterized queries)
- **NFR-SEC-04:** CSRF protection on forms
- **NFR-SEC-05:** Rate limiting ready (no enforcement in MVP, but architecture supports)

### 5.3 Scalability & Extensibility
- **NFR-SCALE-01:** Database schema supports future extensions:
  - User quotas/credits table (ready to add)
  - Rate limiting metadata (ready to add)
  - Saved favorites (ready to add)
- **NFR-SCALE-02:** MCP integration ready for future city event APIs
- **NFR-SCALE-03:** Modular agent prompt design (easy to enhance)

### 5.4 Reliability
- **NFR-REL-01:** Graceful error handling for API failures
- **NFR-REL-02:** Fallback message if Agent SDK times out
- **NFR-REL-03:** Database connection pooling (prevent exhaustion)

---

## 6. Technical Architecture

### 6.1 Technology Stack

#### Frontend
- **Framework:** Astro 4.x
- **Styling:** Tailwind CSS
- **JavaScript:** Vanilla JS or Alpine.js (for SSE streaming)
- **Icons:** Lucide icons or Heroicons

#### Backend
- **Framework:** Astro server endpoints (API routes)
- **AI Agent:** Claude Agent SDK (TypeScript)
- **Web Search:** Serper API (Google Search wrapper)
- **Authentication:** Custom session-based auth
- **Password Hashing:** bcrypt or argon2

#### Database
- **RDBMS:** PostgreSQL 15+
- **ORM/Query Builder:** Drizzle ORM or Prisma (TBD)
- **Migrations:** Drizzle/Prisma migrations

#### Infrastructure (MVP)
- **Hosting:** DigitalOcean App Platform or Droplet
- **Database:** DigitalOcean Managed PostgreSQL
- **Reverse Proxy:** Caddy (production only)
- **Environment:** Node.js 20+
- **Containerization:** Docker (production) + Docker Compose (local dev)

### 6.2 System Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND (Astro)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │ Search Form  │  │ Results Page │  │  History  │ │
│  └──────┬───────┘  └──────┬───────┘  └─────┬─────┘ │
│         │                 │                 │       │
└─────────┼─────────────────┼─────────────────┼───────┘
          │ POST            │ SSE             │ GET
          ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────┐
│              BACKEND (Astro Endpoints)              │
│  ┌──────────────────────────────────────────────┐   │
│  │  /api/search         (POST, SSE streaming)   │   │
│  │  /api/auth/login     (POST)                  │   │
│  │  /api/auth/register  (POST)                  │   │
│  │  /api/auth/logout    (POST)                  │   │
│  │  /api/history        (GET)                   │   │
│  └────────────┬─────────────────────────────────┘   │
│               │                                      │
│     ┌─────────▼─────────┐     ┌──────────────────┐  │
│     │ Claude Agent SDK  │     │  Cache Manager   │  │
│     │  - Analysis       │────▶│  - Check cache   │  │
│     │  - Ranking        │     │  - Store results │  │
│     └─────────┬─────────┘     └────────┬─────────┘  │
│               │                        │            │
│     ┌─────────▼─────────┐              │            │
│     │  Serper API Tool  │              │            │
│     │  (Web Search)     │              │            │
│     └───────────────────┘              │            │
└────────────────────────────────────────┼────────────┘
                                         ▼
                          ┌─────────────────────────┐
                          │   PostgreSQL Database   │
                          │  ┌──────────────────┐   │
                          │  │ users            │   │
                          │  │ sessions         │   │
                          │  │ search_cache     │   │
                          │  │ (future: quotas) │   │
                          │  └──────────────────┘   │
                          └─────────────────────────┘
```

### 6.3 Database Schema

```sql
-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE, -- Optional for MVP, required later
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sessions table
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_session_token (session_token),
    INDEX idx_user_id (user_id)
);

-- Search cache table
CREATE TABLE search_cache (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cache_key VARCHAR(64) UNIQUE NOT NULL, -- SHA-256 hash of search params
    city VARCHAR(100) NOT NULL,
    date_range_start DATE NOT NULL,
    date_range_end DATE NOT NULL,
    attendees TEXT NOT NULL, -- Free-form description
    preferences TEXT, -- Optional additional preferences

    -- AI Agent results (JSON)
    recommendations JSONB NOT NULL, -- Array of recommendation objects
    agent_metadata JSONB, -- Agent reasoning, sources, etc.

    -- Cache management
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL, -- created_at + 48 hours
    access_count INTEGER DEFAULT 1,
    last_accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_cache_key (cache_key),
    INDEX idx_user_id (user_id),
    INDEX idx_expires_at (expires_at)
);

-- Future extension: User quotas (ready to add)
CREATE TABLE user_quotas (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    search_limit INTEGER DEFAULT 100, -- Searches per month
    searches_used INTEGER DEFAULT 0,
    reset_at TIMESTAMP NOT NULL, -- Monthly reset
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 6.4 API Endpoints Specification

#### POST `/api/search`
**Purpose:** Initiate new search or return cached results

**Request:**
```json
{
  "city": "Wrocław",
  "dateRange": {
    "start": "2025-10-18",
    "end": "2025-10-19"
  },
  "attendees": "me, wife, 5yo son who likes climbing",
  "preferences": "active indoor activities, avoid zoo, budget friendly"
}
```

**Response (SSE Stream):**
```
event: progress
data: {"status": "searching", "message": "Searching web for events in Wrocław..."}

event: progress
data: {"status": "analyzing", "message": "Analyzing 15 potential activities..."}

event: progress
data: {"status": "ranking", "message": "Ranking recommendations..."}

event: complete
data: {
  "recommendations": [
    {
      "rank": 1,
      "name": "Jump Hall Ninja Park",
      "description": "Indoor activity center with ninja obstacle courses for ages 3-6...",
      "location": "ul. Szybowcowa 31, Wrocław",
      "estimatedCost": "40-60 PLN per person",
      "ageAppropriate": "Perfect for 5-year-olds",
      "reasoning": "Matches 'active' and 'climbing' preferences, indoor option, age-appropriate program"
    },
    ...
  ],
  "cached": false,
  "searchId": "abc123"
}
```

**Error Response:**
```json
{
  "error": "Search timeout - please try again",
  "code": "TIMEOUT"
}
```

---

#### POST `/api/auth/register`
```json
// Request
{
  "username": "maria123",
  "password": "securePass123!",
  "email": "maria@example.com" // Optional for MVP
}

// Response
{
  "success": true,
  "userId": 42,
  "message": "Account created successfully"
}
```

#### POST `/api/auth/login`
```json
// Request
{
  "username": "maria123",
  "password": "securePass123!"
}

// Response
{
  "success": true,
  "sessionToken": "eyJhbGc...",
  "expiresAt": "2025-10-25T12:00:00Z"
}
// Sets HTTP-only cookie
```

#### POST `/api/auth/logout`
```json
// Response
{
  "success": true,
  "message": "Logged out successfully"
}
// Clears session cookie
```

#### GET `/api/history`
```json
// Response
{
  "searches": [
    {
      "id": 123,
      "city": "Wrocław",
      "dateRange": "Oct 18-19, 2025",
      "attendees": "me, wife, 5yo son",
      "resultCount": 5,
      "createdAt": "2025-10-18T10:30:00Z",
      "expired": false
    },
    ...
  ]
}
```

---

## 7. User Experience & Flows

### 7.1 Core User Flow: New Search

```
1. User lands on homepage (unauthenticated)
   ├─→ [Register] → Fill form → Create account → Login
   └─→ [Login] → Enter credentials → Dashboard

2. Dashboard shows:
   ├─→ "New Search" button (primary CTA)
   ├─→ Recent searches (if any)
   └─→ Quick stats (searches left, if quota implemented later)

3. Click "New Search"
   → Search form page

4. Fill search form:
   ├─→ City: [Wrocław] (autocomplete later)
   ├─→ Dates: [Oct 18-19, 2025] (date picker)
   ├─→ Who: [me, wife, 5yo son who likes climbing]
   └─→ Preferences: [active indoor activities, avoid zoo]

5. Submit form
   ├─→ Check cache (if hit: instant results)
   └─→ No cache: Initiate Agent SDK search
       ├─→ Show progress: "Searching web..."
       ├─→ Show progress: "Analyzing results..."
       └─→ Show progress: "Ranking recommendations..."

6. Results page displays:
   ├─→ 3-5 ranked cards
   ├─→ [Copy All] button
   └─→ "Search again" CTA

7. Copy results → Use in other apps
```

### 7.2 Wireframes (High-Level)

#### Home/Dashboard
```
┌──────────────────────────────────────────────┐
│  [Logo] Weekend Finder        [User] [Logout]│
├──────────────────────────────────────────────┤
│                                              │
│   🎯  Find Your Perfect Weekend              │
│                                              │
│   ┌────────────────────────────────────┐    │
│   │  [+] New Search                    │    │
│   └────────────────────────────────────┘    │
│                                              │
│   Recent Searches:                           │
│   ┌────────────────────────────────────┐    │
│   │ Wrocław · Oct 18-19 · Family       │    │
│   │ 5 recommendations · 2h ago    [→]  │    │
│   └────────────────────────────────────┘    │
│   ┌────────────────────────────────────┐    │
│   │ Kraków · Oct 11-12 · Couple        │    │
│   │ Expired                             │    │
│   └────────────────────────────────────┘    │
└──────────────────────────────────────────────┘
```

#### Search Form
```
┌──────────────────────────────────────────────┐
│  ← Back to Dashboard                         │
├──────────────────────────────────────────────┤
│                                              │
│   Where and when?                            │
│   ┌────────────────────────────────────┐    │
│   │ City: [Wrocław____________]        │    │
│   └────────────────────────────────────┘    │
│   ┌──────────────┐  ┌──────────────┐        │
│   │ From: Oct 18 │  │ To: Oct 19   │        │
│   └──────────────┘  └──────────────┘        │
│                                              │
│   Who's coming?                              │
│   ┌────────────────────────────────────┐    │
│   │ [me, wife, 5yo son who likes___]   │    │
│   │ [climbing_____________________]   │    │
│   └────────────────────────────────────┘    │
│                                              │
│   Any preferences? (optional)                │
│   ┌────────────────────────────────────┐    │
│   │ [active indoor activities,____]   │    │
│   │ [avoid zoo, budget friendly___]   │    │
│   └────────────────────────────────────┘    │
│                                              │
│        [🔍 Find Recommendations]             │
└──────────────────────────────────────────────┘
```

#### Results Page
```
┌──────────────────────────────────────────────┐
│  ← New Search           [📋 Copy All]        │
├──────────────────────────────────────────────┤
│  Top Recommendations for Wrocław             │
│  Oct 18-19, 2025                             │
│                                              │
│  ┌────────────────────────────────────┐     │
│  │ 🥇 #1 JUMP HALL NINJA PARK         │     │
│  │                                    │     │
│  │ Indoor activity center with ninja  │     │
│  │ obstacle courses for ages 3-6...   │     │
│  │                                    │     │
│  │ 📍 ul. Szybowcowa 31              │     │
│  │ 💰 40-60 PLN per person           │     │
│  │ 👶 Perfect for 5-year-olds        │     │
│  │                                    │     │
│  │ ✨ Why: Matches 'active' and      │     │
│  │    'climbing' preferences...       │     │
│  └────────────────────────────────────┘     │
│                                              │
│  ┌────────────────────────────────────┐     │
│  │ 🥈 #2 ZERWA CLIMBING ZONE          │     │
│  │ ...                                │     │
│  └────────────────────────────────────┘     │
└──────────────────────────────────────────────┘
```

---

## 8. Agent SDK Implementation Details

### 8.1 Agent Configuration

```typescript
// src/lib/agent/config.ts
import { ClaudeSDK } from '@anthropic-ai/agent-sdk';
import { SerperSearchTool } from './tools/serper-search';

export const agentConfig = {
  model: 'claude-haiku-4.5-20251015', // Cost-effective choice
  maxTokens: 4000,
  temperature: 0.7,
};

export function createAgent() {
  return new ClaudeSDK({
    apiKey: import.meta.env.ANTHROPIC_API_KEY,
    tools: [
      new SerperSearchTool() // Custom Serper API integration
    ],
    ...agentConfig
  });
}
```

### 8.2 Search Prompt Template

```typescript
// src/lib/agent/prompts.ts
export function buildSearchPrompt(params: SearchParams): string {
  return `You are a local activity expert helping a user find the best weekend activities.

SEARCH PARAMETERS:
- City: ${params.city}
- Dates: ${params.dateRange.start} to ${params.dateRange.end}
- Attendees: ${params.attendees}
- Preferences: ${params.preferences || 'None specified'}

TASK:
1. Search the web for current events, activities, and attractions in ${params.city} during the specified dates
2. Focus on options matching the attendees' age/interests and stated preferences
3. Prioritize unique, high-quality experiences over generic tourist attractions
4. Verify opening hours and availability for the specific dates

OUTPUT FORMAT:
Return 3-5 recommendations ranked by relevance. For each recommendation include:
- Name of the activity/venue
- Description (2-3 sentences explaining what it is)
- Specific address/location
- Estimated cost (if available, or mark as "Free" or "Unknown")
- Age appropriateness (especially if children are mentioned)
- Your reasoning for why this matches their preferences (1 sentence)

Focus on accuracy and recency - only recommend things that are actually happening/available on those specific dates.`;
}
```

### 8.3 Serper API Integration (Custom Web Search Tool)

```typescript
// src/lib/agent/tools/serper-search.ts
import { Tool } from '@anthropic-ai/agent-sdk';

interface SerperResult {
  title: string;
  link: string;
  snippet: string;
  date?: string;
}

interface SerperResponse {
  organic: SerperResult[];
  answerBox?: {
    answer: string;
    snippet: string;
  };
}

export class SerperSearchTool implements Tool {
  name = 'web_search';
  description = 'Search the web for current information about events, activities, and venues. Returns up to 10 relevant results from Google Search.';

  inputSchema = {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'The search query to execute'
      }
    },
    required: ['query']
  };

  async execute(params: { query: string }): Promise<string> {
    try {
      const response = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
          'X-API-KEY': process.env.SERPER_API_KEY!,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          q: params.query,
          num: 10, // Return top 10 results
          gl: 'pl', // Geographic location: Poland
          hl: 'pl'  // Language: Polish (for local results)
        })
      });

      if (!response.ok) {
        throw new Error(`Serper API error: ${response.statusText}`);
      }

      const data: SerperResponse = await response.json();

      // Format results for Claude
      let formattedResults = `Search results for "${params.query}":\n\n`;

      // Include answer box if available (Google featured snippet)
      if (data.answerBox) {
        formattedResults += `Featured Answer: ${data.answerBox.answer}\n\n`;
      }

      // Format organic results
      data.organic.forEach((result, index) => {
        formattedResults += `[${index + 1}] ${result.title}\n`;
        formattedResults += `   ${result.snippet}\n`;
        formattedResults += `   URL: ${result.link}\n`;
        if (result.date) {
          formattedResults += `   Date: ${result.date}\n`;
        }
        formattedResults += `\n`;
      });

      return formattedResults;

    } catch (error) {
      console.error('Serper API error:', error);
      return `Error performing search: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }
}
```

**Why Serper API?**
- **Cost:** $0.001 per search vs. Anthropic's $0.01 (90% cheaper)
- **Free Tier:** 2,500 free searches to start
- **Google Results:** Same quality as Google Search
- **Fast:** Average response time <500ms
- **Flexible:** Returns structured JSON, easy to format for Claude

### 8.4 Agent Execution Flow

```typescript
// src/lib/agent/search.ts
export async function performSearch(
  params: SearchParams,
  onProgress?: (status: string, message: string) => void
): Promise<SearchResults> {

  const agent = createAgent();
  const prompt = buildSearchPrompt(params);

  try {
    onProgress?.('searching', 'Searching web for events...');

    // Stream agent response
    const stream = await agent.query({
      prompt,
      stream: true
    });

    let fullResponse = '';
    let toolCallCount = 0;

    for await (const chunk of stream) {
      // Track tool calls (web searches)
      if (chunk.type === 'tool_use' && chunk.name === 'web_search') {
        toolCallCount++;
        onProgress?.(
          'searching',
          `Search #${toolCallCount}: ${chunk.input.query.substring(0, 50)}...`
        );
      }

      if (chunk.type === 'content') {
        fullResponse += chunk.content;
      }

      // Detect progress stages from agent's work
      if (fullResponse.includes('analyzing')) {
        onProgress?.('analyzing', 'Analyzing results...');
      }
      if (fullResponse.includes('ranking')) {
        onProgress?.('ranking', 'Ranking recommendations...');
      }
    }

    // Parse agent's structured response
    const recommendations = parseAgentResponse(fullResponse);

    return {
      recommendations,
      metadata: {
        promptTokens: stream.usage?.promptTokens,
        completionTokens: stream.usage?.completionTokens,
        searchCount: toolCallCount, // Track search usage
        model: agentConfig.model
      }
    };

  } catch (error) {
    console.error('Agent search failed:', error);
    throw new Error('Failed to generate recommendations');
  }
}
```

---

## 9. Caching Strategy

### 9.1 Cache Key Generation

```typescript
// src/lib/cache/keys.ts
import crypto from 'crypto';

export function generateCacheKey(params: SearchParams): string {
  const normalized = {
    city: params.city.toLowerCase().trim(),
    dateStart: params.dateRange.start,
    dateEnd: params.dateRange.end,
    attendees: params.attendees.toLowerCase().trim(),
    preferences: (params.preferences || '').toLowerCase().trim()
  };

  const serialized = JSON.stringify(normalized);
  return crypto.createHash('sha256').update(serialized).digest('hex');
}
```

### 9.2 Cache Lookup & Storage

```typescript
// src/lib/cache/manager.ts
export async function getCachedSearch(
  cacheKey: string,
  userId: number
): Promise<SearchResults | null> {

  const cached = await db.query.searchCache.findFirst({
    where: and(
      eq(searchCache.cacheKey, cacheKey),
      eq(searchCache.userId, userId),
      gte(searchCache.expiresAt, new Date())
    )
  });

  if (cached) {
    // Update access stats
    await db.update(searchCache)
      .set({
        accessCount: cached.accessCount + 1,
        lastAccessedAt: new Date()
      })
      .where(eq(searchCache.id, cached.id));

    return {
      recommendations: cached.recommendations,
      cached: true,
      searchId: cached.id
    };
  }

  return null;
}

export async function storeSearchResults(
  params: SearchParams,
  results: SearchResults,
  userId: number
): Promise<void> {

  const cacheKey = generateCacheKey(params);
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

  await db.insert(searchCache).values({
    userId,
    cacheKey,
    city: params.city,
    dateRangeStart: new Date(params.dateRange.start),
    dateRangeEnd: new Date(params.dateRange.end),
    attendees: params.attendees,
    preferences: params.preferences,
    recommendations: results.recommendations,
    agentMetadata: results.metadata,
    expiresAt
  });
}
```

### 9.3 Cache Cleanup

```typescript
// src/lib/cache/cleanup.ts
export async function cleanupExpiredCache(): Promise<number> {
  const result = await db.delete(searchCache)
    .where(lt(searchCache.expiresAt, new Date()));

  return result.rowsAffected;
}

// Cron job (run daily)
// 0 2 * * * node scripts/cleanup-cache.js
```

---

## 10. Security Considerations

### 10.1 Authentication Security
- ✅ Passwords hashed with bcrypt (cost factor: 12)
- ✅ Session tokens: cryptographically random UUIDs
- ✅ HTTP-only, Secure, SameSite=Strict cookies
- ✅ Session expiry: 7 days (configurable)

### 10.2 API Security
- ✅ ANTHROPIC_API_KEY in environment variables only
- ✅ SERPER_API_KEY in environment variables only
- ✅ Never expose API keys in frontend
- ✅ Rate limiting architecture ready (user_quotas table)
- ✅ API key validation on server startup

### 10.3 Input Validation
- ✅ Sanitize all user inputs before DB storage
- ✅ Validate date ranges (prevent far-future dates)
- ✅ Max length limits: attendees (500 chars), preferences (1000 chars)

### 10.4 Database Security
- ✅ Parameterized queries (ORM handles this)
- ✅ Principle of least privilege (DB user permissions)
- ✅ Connection pooling with max connections limit

---

## 11. Future Enhancements (Post-MVP)

### 11.1 Phase 2: Enhanced Features
- **FR-FUTURE-01:** Save favorite recommendations to user profile
- **FR-FUTURE-02:** Share recommendations via public link (no login required)
- **FR-FUTURE-03:** Export to calendar (ICS file) or PDF
- **FR-FUTURE-04:** Email notifications for saved searches (when dates approach)
- **FR-FUTURE-05:** City autocomplete with popular cities database

### 11.2 Phase 3: Advanced AI Features
- **FR-FUTURE-06:** MCP integration with official city event APIs (Wrocław, Kraków, etc.)
- **FR-FUTURE-07:** Multi-city comparisons ("Compare Wrocław vs Kraków this weekend")
- **FR-FUTURE-08:** Personalized AI learning (improve recommendations based on past searches)
- **FR-FUTURE-09:** Weather-aware recommendations (suggest indoor if rain forecast)

### 11.3 Phase 4: Monetization
- **FR-FUTURE-10:** Freemium model (5 searches/month free, unlimited for paid)
- **FR-FUTURE-11:** Affiliate links for bookings (activities, restaurants)
- **FR-FUTURE-12:** Premium features (priority search, advanced filters)

---

## 12. Testing Strategy

### 12.1 Unit Tests
- Authentication logic (password hashing, session validation)
- Cache key generation (ensure consistency)
- Agent prompt building

### 12.2 Integration Tests
- API endpoints (auth, search, history)
- Database operations (CRUD for all tables)
- Agent SDK integration (mock responses)

### 12.3 E2E Tests (Playwright)
- User registration → login → search → view results
- Cache hit scenario
- Session expiry handling

### 12.4 Manual Testing Checklist
- [ ] Search with different cities
- [ ] Search with children vs. adults
- [ ] Cache invalidation after 48 hours
- [ ] SSE streaming displays correctly
- [ ] Copy to clipboard works across browsers

---

## 13. Deployment & DevOps

### 13.1 Docker Setup

#### Local Development with Docker Compose

**docker-compose.yml:**
```yaml
version: '3.9'

services:
  postgres:
    image: postgres:16-alpine
    container_name: weekend_finder_db
    restart: unless-stopped
    environment:
      POSTGRES_USER: weekend_user
      POSTGRES_PASSWORD: local_dev_password
      POSTGRES_DB: weekend_finder
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U weekend_user"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

**Local Development Workflow:**
```bash
# Start PostgreSQL
docker-compose up -d postgres

# Run Astro app natively (fast HMR)
npm run dev
```

#### Production Docker Setup

**Dockerfile:**
```dockerfile
FROM node:20-alpine AS base

# Dependencies stage
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Build stage
FROM base AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM base AS runner
WORKDIR /app

# Security: non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 astro

COPY --from=builder --chown=astro:nodejs /app/dist ./dist
COPY --from=deps --chown=astro:nodejs /app/node_modules ./node_modules
COPY --chown=astro:nodejs package*.json ./

USER astro

EXPOSE 4321
ENV HOST=0.0.0.0
ENV PORT=4321
ENV NODE_ENV=production

CMD ["node", "./dist/server/entry.mjs"]
```

**.dockerignore:**
```
node_modules
.git
.env
.env.local
dist
.astro
README.md
.vscode
.idea
*.log
```

#### Production Deployment Options

**Option 1: DigitalOcean App Platform** (Recommended for MVP)
- Automatic Docker builds from Git
- Managed SSL certificates
- Auto-scaling
- Cost: ~$20/month (app + database)

**Option 2: DigitalOcean Droplet with Caddy**

**docker-compose.prod.yml:**
```yaml
version: '3.9'

services:
  app:
    build: .
    restart: unless-stopped
    environment:
      DATABASE_URL: ${DATABASE_URL}
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
      SERPER_API_KEY: ${SERPER_API_KEY}
      SESSION_SECRET: ${SESSION_SECRET}
    networks:
      - weekend_net

  caddy:
    image: caddy:2-alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config
    networks:
      - weekend_net

networks:
  weekend_net:

volumes:
  caddy_data:
  caddy_config:
```

**Caddyfile:**
```caddyfile
your-domain.com {
    reverse_proxy app:4321
    encode gzip

    header {
        Strict-Transport-Security "max-age=31536000;"
        X-Content-Type-Options "nosniff"
        X-Frame-Options "DENY"
    }

    @static path *.css *.js *.jpg *.png *.svg *.woff2
    header @static Cache-Control "public, max-age=31536000"
}
```

### 13.2 Environment Variables

```bash
# .env.example
DATABASE_URL=postgresql://user:pass@localhost:5432/weekend_finder
ANTHROPIC_API_KEY=sk-ant-xxx
SERPER_API_KEY=your-serper-api-key
SESSION_SECRET=random-32-char-string
NODE_ENV=production
```

**Getting API Keys:**
- **Anthropic API Key:** Sign up at https://console.anthropic.com/settings/keys
- **Serper API Key:** Sign up at https://serper.dev/ (2,500 free searches)

### 13.3 Deployment Checklist
- [ ] Set up managed PostgreSQL (Neon/Supabase)
- [ ] Sign up for Serper API (get 2,500 free searches)
- [ ] Sign up for Anthropic API (add credits)
- [ ] Configure environment variables in hosting platform
- [ ] Run database migrations
- [ ] Test Agent SDK connectivity
- [ ] Test Serper API integration
- [ ] Set up daily cron for cache cleanup
- [ ] Configure HTTPS/SSL
- [ ] Monitor error logs (Sentry integration)

**Quick Setup Guide:**

```bash
# 1. Install dependencies
npm install @anthropic-ai/agent-sdk

# 2. Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# 3. Test Serper API
curl -X POST https://google.serper.dev/search \
  -H 'X-API-KEY: your-serper-key' \
  -H 'Content-Type: application/json' \
  -d '{"q":"test query"}'

# 4. Initialize database
npm run db:migrate

# 5. Run development server
npm run dev
```

### 13.4 Monitoring
- Track Agent SDK API usage/costs (Claude token usage)
- Track Serper API usage/costs (search count)
- Monitor database connection pool saturation
- Alert on search timeout rate >10%
- Track cache hit rate (target: >40%)
- Log average searches per request (expect 3-5)

### 13.5 Cost Tracking & Optimization

#### Real-Time Cost Monitoring

```typescript
// src/lib/monitoring/costs.ts
interface RequestCost {
  claudeTokens: {
    input: number;
    output: number;
    cost: number;
  };
  serperSearches: {
    count: number;
    cost: number;
  };
  totalCost: number;
}

export function calculateRequestCost(metadata: any): RequestCost {
  const HAIKU_INPUT_COST = 1 / 1_000_000; // $1 per million
  const HAIKU_OUTPUT_COST = 5 / 1_000_000; // $5 per million
  const SERPER_COST = 0.001; // $0.001 per search

  const claudeCost =
    (metadata.promptTokens * HAIKU_INPUT_COST) +
    (metadata.completionTokens * HAIKU_OUTPUT_COST);

  const serperCost = metadata.searchCount * SERPER_COST;

  return {
    claudeTokens: {
      input: metadata.promptTokens,
      output: metadata.completionTokens,
      cost: claudeCost
    },
    serperSearches: {
      count: metadata.searchCount,
      cost: serperCost
    },
    totalCost: claudeCost + serperCost
  };
}

// Store cost data in cache metadata for analytics
export async function logRequestCost(
  userId: number,
  searchId: number,
  cost: RequestCost
) {
  await db.update(searchCache)
    .set({
      agentMetadata: {
        ...existingMetadata,
        cost
      }
    })
    .where(eq(searchCache.id, searchId));
}
```

#### Monthly Cost Projections

**MVP Launch (500 searches/month):**
```
Assuming 4 Serper searches per request average:

Claude Haiku 4.5:
- Input:  4,000 tokens × 500 = 2M tokens × $1/M = $2.00
- Output: 1,000 tokens × 500 = 0.5M tokens × $5/M = $2.50

Serper API:
- Searches: 4 × 500 = 2,000 searches × $0.001 = $2.00

Total monthly cost: ~$6.50

With 40% cache hit rate:
- Actual API calls: 300 searches
- Claude: ~$1.50
- Serper: ~$1.20
Total: ~$2.70/month
```

**Growth Phase (5,000 searches/month):**
```
Without caching: ~$65/month
With 50% cache hit: ~$32.50/month
```

**Cost Comparison (per 1,000 searches):**

| Component | Anthropic Web Search | Serper API | Savings |
|-----------|---------------------|------------|---------|
| Web searches | $40 (4 searches avg) | $4 | **$36** |
| Claude tokens | $5 | $5 | $0 |
| **Total** | **$45** | **$9** | **80% cheaper** |

---

## 14. Open Questions & Decisions

### 14.1 Resolved
- ✅ **Q:** WebSockets or SSE for streaming?
  **A:** SSE (Server-Sent Events) - simpler, works with Agent SDK's AsyncIterator

- ✅ **Q:** Email required for MVP?
  **A:** No, but database field added for future

- ✅ **Q:** Rate limiting in MVP?
  **A:** No enforcement, but schema ready for Phase 2

- ✅ **Q:** Which web search API to use?
  **A:** Serper API - 90% cheaper than Anthropic's built-in search ($0.001 vs $0.01 per search)

### 14.2 To Be Decided
- ⏳ **ORM Choice:** Drizzle vs. Prisma (both support Astro)
- ⏳ **Hosting Platform:** Vercel (serverless) vs. Railway (traditional)
- ⏳ **Error Tracking:** Sentry vs. LogRocket
- ⏳ **Analytics:** PostHog vs. Plausible (privacy-focused)

---

## 15. Success Criteria (MVP Launch)

### Must Have ✅
- [ ] User can register and login
- [ ] User can create search with all required fields
- [ ] Agent SDK performs web search and returns 3-5 recommendations
- [ ] Results cached for 48 hours
- [ ] Copy to clipboard works
- [ ] Responsive design (mobile + desktop)
- [ ] HTTPS deployed to production

### Should Have 🎯
- [ ] SSE streaming shows real-time progress
- [ ] Search history visible (last 10 searches)
- [ ] Cache hit rate >30%
- [ ] Search completes in <30 seconds (90% of queries)

### Could Have 💡
- [ ] City autocomplete
- [ ] Dark mode
- [ ] Social sharing preview (Open Graph tags)

---

## 16. Timeline Estimate

### Week 1: Foundation
- Day 1-2: Project setup (Astro, Tailwind, DB schema)
- Day 3-4: Authentication system
- Day 5-7: Database models and migrations

### Week 2: Core Features
- Day 8-9: Serper API integration + custom tool implementation
- Day 10-11: Agent SDK integration + search logic
- Day 12-13: Caching system
- Day 14: SSE streaming implementation

### Week 3: UI & Polish
- Day 15-17: Frontend pages (forms, results, history)
- Day 18-19: Responsive design + styling
- Day 20-21: Testing + bug fixes

### Week 4: Launch
- Day 22-23: Deployment setup
- Day 24-25: Production testing
- Day 26-28: Soft launch + monitoring

**Total: 4 weeks (1 developer)**

---

## 17. Appendices

### A. Glossary
- **Agent SDK:** Anthropic's SDK for building AI agents with Claude
- **MCP:** Model Context Protocol - standard for connecting AI to external tools
- **SSE:** Server-Sent Events - unidirectional server-to-client streaming
- **Cache TTL:** Time To Live - how long cached data remains valid
- **Drizzle/Prisma:** TypeScript-first ORMs for PostgreSQL
- **Serper API:** Google Search API wrapper providing cost-effective web search

### B. References
- [Claude Agent SDK Docs](https://docs.claude.com/en/api/agent-sdk/overview)
- [Astro Framework](https://astro.build/)
- [Model Context Protocol](https://www.anthropic.com/news/model-context-protocol)
- [Server-Sent Events MDN](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
- [Serper API Docs](https://serper.dev/docs)
- [Anthropic Pricing](https://docs.claude.com/en/docs/about-claude/pricing)

### C. Cost Optimization Summary

**Key Decisions for MVP:**
1. ✅ **Claude Haiku 4.5** instead of Sonnet 4.5 (60% cheaper)
2. ✅ **Serper API** instead of Anthropic web search (90% cheaper per search)
3. ✅ **48-hour caching** reduces API calls by 40-50%
4. ✅ **Search result reuse** across similar queries

**Expected Costs:**
- **MVP (500 searches/month):** ~$2.70/month with caching
- **Growth (5,000 searches/month):** ~$32.50/month with caching
- **Comparison:** 80% cheaper than using Anthropic's built-in web search

---

**Document Version History:**
- v1.0.0 (2025-10-18): Initial PRD draft based on stakeholder requirements
- v1.1.0 (2025-10-18): Added Serper API integration, updated cost model with Haiku 4.5, added detailed cost tracking and monitoring
- v1.2.0 (2025-10-18): Added Docker setup for local dev and production deployment (DigitalOcean)
