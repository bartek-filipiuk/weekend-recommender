# 🚀 Weekend Finder MVP - Developer Handoff Guide

**Version:** 1.0
**Target Completion:** 4 weeks (1 developer)
**Stack:** Astro + Claude Agent SDK + Serper API + PostgreSQL + Docker

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Week 1: Project Foundation](#week-1-project-foundation)
3. [Week 2: Core Features](#week-2-core-features)
4. [Week 3: UI & Polish](#week-3-ui--polish)
5. [Week 4: Deployment](#week-4-deployment)
6. [Reference Files](#reference-files)

---

## Prerequisites

### Required Accounts & API Keys

- [ ] **Anthropic API** - Sign up at https://console.anthropic.com
  - Add $10 credits to start (MVP should cost ~$3/month)
  - Get API key from Settings → API Keys
- [ ] **Serper API** - Sign up at https://serper.dev
  - Free tier: 2,500 searches/month (enough for MVP)
  - Get API key from dashboard
- [ ] **DigitalOcean Account** - https://digitalocean.com
  - For production deployment
  - Initial credit may be available
- [ ] **GitHub Account** - For version control

### Local Development Tools

- [ ] **Node.js 20+** installed (`node -v` to check)
- [ ] **Docker Desktop** installed (for PostgreSQL)
- [ ] **Git** installed
- [ ] **Code Editor** (VS Code recommended with Astro extension)
- [ ] **Terminal** (iTerm2, Warp, or built-in)

---

## Week 1: Project Foundation

### Day 1-2: Initial Setup & Configuration

#### Step 1.1: Create Project Structure

```bash
# Create project directory
mkdir weekend-finder
cd weekend-finder

# Initialize npm project
npm create astro@latest . -- --template minimal --typescript strict

# Project setup prompts:
# - Directory: . (current)
# - Install dependencies: Yes
# - TypeScript: Yes, strict
# - Git: Yes
```

**Checklist:**
- [ ] Project created successfully
- [ ] TypeScript strict mode enabled
- [ ] Git initialized

#### Step 1.2: Install Core Dependencies

```bash
# Core framework
npm install @astrojs/node

# Database
npm install drizzle-orm postgres
npm install -D drizzle-kit

# Authentication & Security
npm install bcryptjs argon2
npm install -D @types/bcryptjs

# AI & Search
npm install @anthropic-ai/agent-sdk

# Utilities
npm install zod dotenv
```

**Checklist:**
- [ ] All dependencies installed
- [ ] No npm errors
- [ ] package.json updated

#### Step 1.3: Create File Structure

```bash
# Create directory structure
mkdir -p src/pages/api/{auth,search}
mkdir -p src/lib/{agent,cache,db,auth,monitoring}
mkdir -p src/lib/agent/tools
mkdir -p src/components
mkdir -p src/layouts
mkdir -p database/migrations
mkdir -p scripts

# Create configuration files
touch .env.example .env.local .dockerignore
touch docker-compose.yml Dockerfile Caddyfile
```

**Checklist:**
- [ ] Directory structure created
- [ ] Ready for code implementation

#### Step 1.4: Configure Astro

**File: `astro.config.mjs`**

```typescript
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  output: 'server',
  adapter: node({
    mode: 'standalone'
  }),
  integrations: [tailwind()],
  server: {
    port: 4321,
    host: process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost'
  }
});
```

**Checklist:**
- [ ] Astro configured for SSR
- [ ] Node adapter added
- [ ] Tailwind CSS integrated

#### Step 1.5: Setup Docker for PostgreSQL

**File: `docker-compose.yml`**

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

**Start PostgreSQL:**
```bash
docker-compose up -d postgres

# Verify it's running
docker ps
```

**Checklist:**
- [ ] Docker Compose file created
- [ ] PostgreSQL container running
- [ ] Can connect to localhost:5432

#### Step 1.6: Environment Configuration

**File: `.env.example`**

```bash
# Database
DATABASE_URL=postgresql://weekend_user:local_dev_password@localhost:5432/weekend_finder

# AI APIs
ANTHROPIC_API_KEY=sk-ant-your-key-here
SERPER_API_KEY=your-serper-key-here

# Security
SESSION_SECRET=generate-random-32-char-string-here

# Environment
NODE_ENV=development
```

**File: `.env.local`** (copy from .env.example and fill in real keys)

```bash
cp .env.example .env.local
# Edit .env.local with your actual API keys
```

**Checklist:**
- [ ] .env.example created
- [ ] .env.local created with real API keys
- [ ] .env.local added to .gitignore

---

### Day 3-4: Database Setup

#### Step 2.1: Define Database Schema with Drizzle

**File: `src/lib/db/schema.ts`**

```typescript
import { pgTable, serial, varchar, timestamp, text, integer, jsonb, uuid, index } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 50 }).unique().notNull(),
  email: varchar('email', { length: 255 }).unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  sessionToken: varchar('session_token', { length: 255 }).unique().notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  sessionTokenIdx: index('idx_session_token').on(table.sessionToken),
  userIdIdx: index('idx_user_id').on(table.userId)
}));

export const searchCache = pgTable('search_cache', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  cacheKey: varchar('cache_key', { length: 64 }).unique().notNull(),
  city: varchar('city', { length: 100 }).notNull(),
  dateRangeStart: timestamp('date_range_start').notNull(),
  dateRangeEnd: timestamp('date_range_end').notNull(),
  attendees: text('attendees').notNull(),
  preferences: text('preferences'),
  recommendations: jsonb('recommendations').notNull(),
  agentMetadata: jsonb('agent_metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  accessCount: integer('access_count').default(1).notNull(),
  lastAccessedAt: timestamp('last_accessed_at').defaultNow().notNull()
}, (table) => ({
  cacheKeyIdx: index('idx_cache_key').on(table.cacheKey),
  userIdIdx: index('idx_user_id_cache').on(table.userId),
  expiresAtIdx: index('idx_expires_at').on(table.expiresAt)
}));
```

**Checklist:**
- [ ] Schema file created
- [ ] All tables defined
- [ ] Indexes added

#### Step 2.2: Database Connection

**File: `src/lib/db/index.ts`**

```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = import.meta.env.DATABASE_URL || process.env.DATABASE_URL!;

// Create connection
const client = postgres(connectionString, {
  max: 10, // Connection pool size
  idle_timeout: 20,
  connect_timeout: 10
});

export const db = drizzle(client, { schema });
```

**Checklist:**
- [ ] Database connection file created
- [ ] Connection pooling configured

#### Step 2.3: Drizzle Configuration & Migrations

**File: `drizzle.config.ts`**

```typescript
import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

export default {
  schema: './src/lib/db/schema.ts',
  out: './database/migrations',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!
  }
} satisfies Config;
```

**Generate and run migrations:**

```bash
# Generate migration files
npx drizzle-kit generate:pg

# Apply migrations
npx drizzle-kit push:pg

# Verify tables created
docker exec -it weekend_finder_db psql -U weekend_user -d weekend_finder -c "\dt"
```

**Checklist:**
- [ ] Drizzle config created
- [ ] Migrations generated
- [ ] Migrations applied successfully
- [ ] Tables visible in database

---

### Day 5-7: Authentication System

#### Step 3.1: Password Hashing Utilities

**File: `src/lib/auth/password.ts`**

```typescript
import * as argon2 from 'argon2';

export async function hashPassword(password: string): Promise<string> {
  return await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4
  });
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch (error) {
    return false;
  }
}
```

**Checklist:**
- [ ] Password utilities created
- [ ] Uses argon2id (secure)

#### Step 3.2: Session Management

**File: `src/lib/auth/session.ts`**

```typescript
import { db } from '../db';
import { sessions, users } from '../db/schema';
import { eq, and, gte } from 'drizzle-orm';
import crypto from 'crypto';

const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function createSession(userId: number): Promise<string> {
  const sessionToken = crypto.randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + SESSION_DURATION);

  await db.insert(sessions).values({
    userId,
    sessionToken,
    expiresAt
  });

  return sessionToken;
}

export async function validateSession(sessionToken: string) {
  const result = await db
    .select({
      session: sessions,
      user: users
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(
      and(
        eq(sessions.sessionToken, sessionToken),
        gte(sessions.expiresAt, new Date())
      )
    )
    .limit(1);

  return result[0] || null;
}

export async function deleteSession(sessionToken: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.sessionToken, sessionToken));
}
```

**Checklist:**
- [ ] Session creation implemented
- [ ] Session validation implemented
- [ ] Session deletion implemented

#### Step 3.3: Registration API Endpoint

**File: `src/pages/api/auth/register.ts`**

```typescript
import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import { users } from '../../../lib/db/schema';
import { hashPassword } from '../../../lib/auth/password';
import { createSession } from '../../../lib/auth/session';
import { eq } from 'drizzle-orm';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { username, password, email } = await request.json();

    // Validation
    if (!username || !password) {
      return new Response(JSON.stringify({ error: 'Username and password required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (username.length < 3 || username.length > 50) {
      return new Response(JSON.stringify({ error: 'Username must be 3-50 characters' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (password.length < 8) {
      return new Response(JSON.stringify({ error: 'Password must be at least 8 characters' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if user exists
    const existingUser = await db.select().from(users).where(eq(users.username, username)).limit(1);
    if (existingUser.length > 0) {
      return new Response(JSON.stringify({ error: 'Username already exists' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create user
    const passwordHash = await hashPassword(password);
    const [newUser] = await db.insert(users).values({
      username,
      email: email || null,
      passwordHash
    }).returning();

    // Create session
    const sessionToken = await createSession(newUser.id);

    // Set cookie
    cookies.set('session', sessionToken, {
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/'
    });

    return new Response(JSON.stringify({
      success: true,
      userId: newUser.id,
      username: newUser.username
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Registration error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
```

**Checklist:**
- [ ] Registration endpoint created
- [ ] Input validation implemented
- [ ] Duplicate username check
- [ ] Password hashing
- [ ] Session creation
- [ ] Cookie set

#### Step 3.4: Login API Endpoint

**File: `src/pages/api/auth/login.ts`**

```typescript
import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import { users } from '../../../lib/db/schema';
import { verifyPassword } from '../../../lib/auth/password';
import { createSession } from '../../../lib/auth/session';
import { eq } from 'drizzle-orm';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return new Response(JSON.stringify({ error: 'Username and password required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Find user
    const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);

    if (!user) {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify password
    const validPassword = await verifyPassword(user.passwordHash, password);

    if (!validPassword) {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create session
    const sessionToken = await createSession(user.id);

    // Set cookie
    cookies.set('session', sessionToken, {
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60,
      path: '/'
    });

    return new Response(JSON.stringify({
      success: true,
      userId: user.id,
      username: user.username
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Login error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
```

**Checklist:**
- [ ] Login endpoint created
- [ ] User lookup
- [ ] Password verification
- [ ] Session creation

#### Step 3.5: Logout Endpoint

**File: `src/pages/api/auth/logout.ts`**

```typescript
import type { APIRoute } from 'astro';
import { deleteSession } from '../../../lib/auth/session';

export const POST: APIRoute = async ({ cookies }) => {
  const sessionToken = cookies.get('session')?.value;

  if (sessionToken) {
    await deleteSession(sessionToken);
  }

  cookies.delete('session', { path: '/' });

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
```

**Checklist:**
- [ ] Logout endpoint created
- [ ] Session deleted
- [ ] Cookie cleared

---

## Week 2: Core Features

### Day 8-9: Serper API Integration

#### Step 4.1: Serper Search Tool

**File: `src/lib/agent/tools/serper-search.ts`**

```typescript
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
          num: 10,
          gl: 'pl',
          hl: 'pl'
        })
      });

      if (!response.ok) {
        throw new Error(`Serper API error: ${response.statusText}`);
      }

      const data: SerperResponse = await response.json();

      let formattedResults = `Search results for "${params.query}":\n\n`;

      if (data.answerBox) {
        formattedResults += `Featured Answer: ${data.answerBox.answer}\n\n`;
      }

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

**Test Serper API:**

```bash
curl -X POST https://google.serper.dev/search \
  -H "X-API-KEY: your-key-here" \
  -H "Content-Type: application/json" \
  -d '{"q":"Wrocław weekend activities"}'
```

**Checklist:**
- [ ] Serper tool created
- [ ] Implements Tool interface
- [ ] Test API call successful
- [ ] Returns formatted results

### Day 10-11: Claude Agent SDK Integration

#### Step 5.1: Agent Configuration

**File: `src/lib/agent/config.ts`**

```typescript
import { ClaudeSDK } from '@anthropic-ai/agent-sdk';
import { SerperSearchTool } from './tools/serper-search';

export const agentConfig = {
  model: 'claude-haiku-4.5-20251015',
  maxTokens: 4000,
  temperature: 0.7,
};

export function createAgent() {
  return new ClaudeSDK({
    apiKey: process.env.ANTHROPIC_API_KEY!,
    tools: [new SerperSearchTool()],
    ...agentConfig
  });
}
```

**Checklist:**
- [ ] Agent config created
- [ ] Serper tool registered
- [ ] API key from env

#### Step 5.2: Search Prompts

**File: `src/lib/agent/prompts.ts`**

```typescript
export interface SearchParams {
  city: string;
  dateRange: {
    start: string;
    end: string;
  };
  attendees: string;
  preferences?: string;
}

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

**Checklist:**
- [ ] Search params interface defined
- [ ] Prompt template created
- [ ] Clear instructions for agent

#### Step 5.3: Agent Search Execution

**File: `src/lib/agent/search.ts`**

```typescript
import { createAgent } from './config';
import { buildSearchPrompt, type SearchParams } from './prompts';

export interface Recommendation {
  rank: number;
  name: string;
  description: string;
  location: string;
  estimatedCost: string;
  ageAppropriate?: string;
  reasoning: string;
}

export interface SearchResults {
  recommendations: Recommendation[];
  metadata: {
    promptTokens?: number;
    completionTokens?: number;
    searchCount: number;
    model: string;
  };
  cached: boolean;
  searchId?: number;
}

type ProgressCallback = (status: string, message: string) => void;

export async function performSearch(
  params: SearchParams,
  onProgress?: ProgressCallback
): Promise<SearchResults> {
  const agent = createAgent();
  const prompt = buildSearchPrompt(params);

  try {
    onProgress?.('searching', 'Searching web for events...');

    const stream = await agent.query({
      prompt,
      stream: true
    });

    let fullResponse = '';
    let toolCallCount = 0;

    for await (const chunk of stream) {
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

      if (fullResponse.includes('analyzing')) {
        onProgress?.('analyzing', 'Analyzing results...');
      }
      if (fullResponse.includes('ranking')) {
        onProgress?.('ranking', 'Ranking recommendations...');
      }
    }

    const recommendations = parseAgentResponse(fullResponse);

    return {
      recommendations,
      metadata: {
        promptTokens: stream.usage?.promptTokens,
        completionTokens: stream.usage?.completionTokens,
        searchCount: toolCallCount,
        model: 'claude-haiku-4.5-20251015'
      },
      cached: false
    };

  } catch (error) {
    console.error('Agent search failed:', error);
    throw new Error('Failed to generate recommendations');
  }
}

function parseAgentResponse(response: string): Recommendation[] {
  // TODO: Implement parsing logic
  // For now, use JSON extraction or regex
  // This will parse the agent's structured response
  return [];
}
```

**Checklist:**
- [ ] Search execution implemented
- [ ] Progress callbacks
- [ ] Tool call tracking
- [ ] Response parsing (implement based on agent output format)

### Day 12-13: Caching System

#### Step 6.1: Cache Key Generation

**File: `src/lib/cache/keys.ts`**

```typescript
import crypto from 'crypto';
import type { SearchParams } from '../agent/prompts';

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

**Checklist:**
- [ ] Cache key function created
- [ ] Normalizes input
- [ ] Uses SHA-256 hash

#### Step 6.2: Cache Manager

**File: `src/lib/cache/manager.ts`**

```typescript
import { db } from '../db';
import { searchCache } from '../db/schema';
import { eq, and, gte } from 'drizzle-orm';
import { generateCacheKey } from './keys';
import type { SearchParams } from '../agent/prompts';
import type { SearchResults } from '../agent/search';

export async function getCachedSearch(
  params: SearchParams,
  userId: number
): Promise<SearchResults | null> {
  const cacheKey = generateCacheKey(params);

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

  if (cached) {
    // Update access stats
    await db.update(searchCache)
      .set({
        accessCount: cached.accessCount + 1,
        lastAccessedAt: new Date()
      })
      .where(eq(searchCache.id, cached.id));

    return {
      recommendations: cached.recommendations as any,
      metadata: cached.agentMetadata as any,
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
): Promise<number> {
  const cacheKey = generateCacheKey(params);
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

  const [inserted] = await db.insert(searchCache).values({
    userId,
    cacheKey,
    city: params.city,
    dateRangeStart: new Date(params.dateRange.start),
    dateRangeEnd: new Date(params.dateRange.end),
    attendees: params.attendees,
    preferences: params.preferences || null,
    recommendations: results.recommendations as any,
    agentMetadata: results.metadata as any,
    expiresAt
  }).returning();

  return inserted.id;
}
```

**Checklist:**
- [ ] Cache lookup implemented
- [ ] Cache storage implemented
- [ ] Access tracking
- [ ] TTL enforcement

### Day 14: Search API with SSE

#### Step 7.1: Search API Endpoint

**File: `src/pages/api/search.ts`**

```typescript
import type { APIRoute } from 'astro';
import { validateSession } from '../../lib/auth/session';
import { getCachedSearch, storeSearchResults } from '../../lib/cache/manager';
import { performSearch } from '../../lib/agent/search';
import type { SearchParams } from '../../lib/agent/prompts';

export const POST: APIRoute = async ({ request, cookies }) => {
  // Validate session
  const sessionToken = cookies.get('session')?.value;
  if (!sessionToken) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const sessionData = await validateSession(sessionToken);
  if (!sessionData) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const params: SearchParams = await request.json();

    // Validate params
    if (!params.city || !params.dateRange || !params.attendees) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check cache
    const cached = await getCachedSearch(params, sessionData.user.id);
    if (cached) {
      return new Response(JSON.stringify(cached), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Perform search with SSE streaming
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        const sendEvent = (status: string, message: string) => {
          const data = JSON.stringify({ status, message });
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        };

        try {
          const results = await performSearch(params, sendEvent);

          // Store in cache
          const searchId = await storeSearchResults(params, results, sessionData.user.id);
          results.searchId = searchId;

          // Send final results
          const finalData = JSON.stringify({ status: 'complete', data: results });
          controller.enqueue(encoder.encode(`data: ${finalData}\n\n`));

          controller.close();
        } catch (error) {
          const errorData = JSON.stringify({
            status: 'error',
            message: error instanceof Error ? error.message : 'Search failed'
          });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });

  } catch (error) {
    console.error('Search error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
```

**Checklist:**
- [ ] Search endpoint created
- [ ] Session validation
- [ ] Cache check
- [ ] SSE streaming
- [ ] Error handling

---

## Week 3: UI & Polish

### Day 15-17: Frontend Pages

#### Step 8.1: Main Layout

**File: `src/layouts/Layout.astro`**

```astro
---
interface Props {
  title: string;
}

const { title } = Astro.props;
---

<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <title>{title} - Weekend Finder</title>
  </head>
  <body class="bg-gray-50 min-h-screen">
    <slot />
  </body>
</html>

<style is:global>
  @tailwind base;
  @tailwind components;
  @tailwind utilities;
</style>
```

**Checklist:**
- [ ] Base layout created
- [ ] Tailwind included
- [ ] Responsive meta tag

#### Step 8.2: Authentication Pages

**File: `src/pages/register.astro`** (create similar for login.astro)

```astro
---
import Layout from '../layouts/Layout.astro';
---

<Layout title="Register">
  <div class="min-h-screen flex items-center justify-center px-4">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="text-3xl font-bold text-center">Create Account</h2>
      </div>
      <form id="registerForm" class="space-y-6">
        <div>
          <label for="username" class="block text-sm font-medium">Username</label>
          <input
            type="text"
            id="username"
            name="username"
            required
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
        <div>
          <label for="password" class="block text-sm font-medium">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            required
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
        <button
          type="submit"
          class="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Sign Up
        </button>
      </form>
      <div id="error" class="text-red-600 text-sm"></div>
    </div>
  </div>
</Layout>

<script>
  document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: formData.get('username'),
        password: formData.get('password')
      })
    });

    const data = await response.json();

    if (response.ok) {
      window.location.href = '/dashboard';
    } else {
      document.getElementById('error')!.textContent = data.error;
    }
  });
</script>
```

**Checklist:**
- [ ] Register page created
- [ ] Login page created
- [ ] Forms functional
- [ ] Error handling

#### Step 8.3: Dashboard Page

**File: `src/pages/dashboard.astro`**

```astro
---
// TODO: Implement dashboard with:
// - New Search button
// - Recent searches list
// - User info display
---
```

#### Step 8.4: Search Form Page

**File: `src/pages/search.astro`**

```astro
---
// TODO: Implement search form with:
// - City input
// - Date range picker
// - Attendees textarea
// - Preferences textarea
// - Submit button
---
```

#### Step 8.5: Results Page

**File: `src/pages/results/[id].astro`**

```astro
---
// TODO: Implement results display with:
// - Ranked recommendation cards
// - Copy all button
// - Back to dashboard link
---
```

**Checklist:**
- [ ] Dashboard page created
- [ ] Search form page created
- [ ] Results page created
- [ ] Navigation between pages

### Day 18-19: Styling & Responsiveness

**Checklist:**
- [ ] Tailwind classes applied
- [ ] Mobile responsive
- [ ] Desktop layout
- [ ] Loading states
- [ ] Error states
- [ ] Success states

### Day 20-21: Testing & Bug Fixes

**Manual Testing Checklist:**
- [ ] User can register
- [ ] User can login
- [ ] User can logout
- [ ] Search form validates input
- [ ] Search shows progress
- [ ] Results display correctly
- [ ] Cache works (second search instant)
- [ ] Copy to clipboard works
- [ ] Session persists across refreshes
- [ ] Session expires after 7 days

---

## Week 4: Deployment

### Day 22-23: Production Setup

#### Step 9.1: Create Production Docker Files

**File: `Dockerfile`** (from PRD section 13.1)

**File: `.dockerignore`**

```
node_modules
.git
.env
.env.local
dist
.astro
*.log
```

**Checklist:**
- [ ] Dockerfile created
- [ ] .dockerignore created
- [ ] Test build locally: `docker build -t weekend-finder .`

#### Step 9.2: DigitalOcean Setup

**Option A: App Platform (Recommended)**

1. Create DigitalOcean account
2. Create new App:
   - Source: GitHub repo
   - Build Command: `npm run build`
   - Run Command: `node ./dist/server/entry.mjs`
   - Environment: Add all env vars from .env.example

3. Create Managed PostgreSQL:
   - Version: 16
   - Size: Basic (1GB RAM, $15/month)
   - Get connection string

4. Add DATABASE_URL to app environment variables

**Option B: Droplet + Docker Compose**

```bash
# SSH into droplet
ssh root@your-droplet-ip

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Clone repo
git clone https://github.com/your-username/weekend-finder.git
cd weekend-finder

# Create .env file with production values
nano .env

# Deploy
docker-compose -f docker-compose.prod.yml up -d
```

**Checklist:**
- [ ] DigitalOcean account created
- [ ] Managed PostgreSQL created
- [ ] App deployed
- [ ] Environment variables set
- [ ] Database migrations run

### Day 24-25: Production Testing

**Checklist:**
- [ ] App accessible via HTTPS
- [ ] SSL certificate valid
- [ ] Database connection works
- [ ] Agent SDK calls succeed
- [ ] Serper API calls succeed
- [ ] Auth flow works
- [ ] Search works
- [ ] Cache works
- [ ] No console errors
- [ ] Performance acceptable (<30s searches)

### Day 26-28: Monitoring & Launch

#### Step 10.1: Cost Monitoring Script

**File: `scripts/cost-monitor.ts`**

```typescript
// TODO: Implement cost tracking query
// Select all searches from last 30 days
// Sum up searchCount (Serper costs)
// Sum up token usage (Claude costs)
// Display monthly projection
```

#### Step 10.2: Cache Cleanup Cron

**File: `scripts/cleanup-cache.ts`**

```typescript
import { db } from '../src/lib/db';
import { searchCache } from '../src/lib/db/schema';
import { lt } from 'drizzle-orm';

async function cleanupExpiredCache() {
  const result = await db
    .delete(searchCache)
    .where(lt(searchCache.expiresAt, new Date()));

  console.log(`Cleaned up ${result.rowCount} expired cache entries`);
}

cleanupExpiredCache().then(() => process.exit(0));
```

**Setup cron job:**
```bash
# On DigitalOcean Droplet
crontab -e

# Add line:
0 2 * * * cd /path/to/weekend-finder && node scripts/cleanup-cache.js
```

**Launch Checklist:**
- [ ] Monitoring script created
- [ ] Cron job configured
- [ ] Error tracking (optional: Sentry)
- [ ] Analytics (optional: Plausible)
- [ ] Backup strategy for database
- [ ] README.md updated
- [ ] CHANGELOG.md created

---

## Reference Files

### Quick Commands Reference

```bash
# Local Development
docker-compose up -d postgres       # Start DB
npm run dev                         # Start dev server
npx drizzle-kit push:pg            # Run migrations

# Production Build
docker build -t weekend-finder .    # Build Docker image
docker-compose -f docker-compose.prod.yml up -d  # Deploy

# Database
docker exec -it weekend_finder_db psql -U weekend_user -d weekend_finder

# Testing APIs
curl -X POST http://localhost:4321/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test1234"}'
```

### Environment Variables Checklist

```
✅ DATABASE_URL
✅ ANTHROPIC_API_KEY
✅ SERPER_API_KEY
✅ SESSION_SECRET
✅ NODE_ENV
```

### Final Verification Checklist

**MVP Must-Haves:**
- [ ] User registration/login works
- [ ] Search with all fields works
- [ ] Agent SDK returns 3-5 recommendations
- [ ] Results cached for 48 hours
- [ ] Copy to clipboard works
- [ ] Mobile + desktop responsive
- [ ] HTTPS in production
- [ ] Costs under $5/month for MVP usage

**Documentation:**
- [ ] README.md with setup instructions
- [ ] API documentation
- [ ] Deployment guide
- [ ] Troubleshooting section

---

## Success Criteria

Your MVP is complete when:

1. ✅ A user can create an account
2. ✅ A user can search for weekend activities
3. ✅ The app shows real-time search progress
4. ✅ Results are displayed in ranked cards
5. ✅ Results are cached (instant on second search)
6. ✅ User can copy all results to clipboard
7. ✅ App is deployed to production with HTTPS
8. ✅ Monthly costs are under budget (~$20-25/month total)

---

## Getting Help

- **PRD:** See `PRD.md` for detailed architecture
- **Astro Docs:** https://docs.astro.build
- **Claude SDK:** https://docs.claude.com/en/api/agent-sdk/overview
- **Serper API:** https://serper.dev/docs
- **Drizzle ORM:** https://orm.drizzle.team

---

**Good luck! 🚀**

*Estimated completion: 4 weeks for 1 developer*
*Questions? Review the PRD.md for detailed specifications.*
