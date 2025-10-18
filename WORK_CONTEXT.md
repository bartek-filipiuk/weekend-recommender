# Weekend Finder - Work Context & Resumption Guide

**Version:** 1.1.0
**Last Updated:** 2025-10-18
**Project Status:** Stage 2 - Authentication System (In Progress)

---

## Table of Contents

1. [Project Quick Reference](#project-quick-reference)
2. [Current Status Tracker](#current-status-tracker)
3. [Quick Start (5-Minute Setup)](#quick-start-5-minute-setup)
4. [Environment Configuration](#environment-configuration)
5. [Stage-by-Stage Context](#stage-by-stage-context)
6. [Verification Commands](#verification-commands)
7. [Command Reference](#command-reference)
8. [Common Issues & Solutions](#common-issues--solutions)
9. [Workflow for Each Stage](#workflow-for-each-stage)
10. [Stage Transition Checklist](#stage-transition-checklist)

---

## Project Quick Reference

### What is Weekend Finder?

An AI-powered weekend activity finder that helps parents discover activities for their children using Claude Agent SDK and Serper API.

### Tech Stack

- **Frontend:** Astro 4.x (SSR)
- **Database:** PostgreSQL 15+ (via Docker Compose)
- **ORM:** Drizzle ORM
- **AI:** Claude Haiku 4.5 via Agent SDK
- **Search:** Serper API (Google Search wrapper)
- **Auth:** Session-based with Argon2
- **Deployment:** DigitalOcean (production)

### Key Documents

- **[PRD.md](./PRD.md)** - Complete product requirements (v1.2.0, 1,376 lines)
- **[HANDOFF.md](./HANDOFF.md)** - Week-by-week implementation guide (1,555 lines)
- **[IMPLEMENTATION_STAGES.md](./IMPLEMENTATION_STAGES.md)** - 7 PR stages breakdown (698 lines)
- **[WORK_CONTEXT.md](./WORK_CONTEXT.md)** - This file (resumption guide)

### Cost Estimates (with caching)

- **Per Search:** ~$0.013 ($0.009 Claude + $0.004 Serper)
- **500 searches/month:** ~$2.70/month
- **1,000 searches/month:** ~$5.40/month

---

## Current Status Tracker

**Update this section as stages are completed.**

```
┌─────────────────────────────────────────────────────────────┐
│ WEEKEND FINDER - IMPLEMENTATION PROGRESS                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ✅ Stage 1: Foundation & Database          [100%]  [COMPLETED]│
│    └─ Branch: feat/foundation-and-database (merged)         │
│    └─ Duration: 3-4 days                                    │
│                                                             │
│ 🔄 Stage 2: Authentication System          [90%]  [IN PROGRESS]│
│    └─ Branch: feat/authentication-system                    │
│    └─ Duration: 3-4 days                                    │
│                                                             │
│ ⬜ Stage 3: Search Infrastructure          [0%]  [NOT STARTED]│
│    └─ Branch: feat/search-infrastructure                    │
│    └─ Duration: 4-5 days                                    │
│                                                             │
│ ⬜ Stage 4: Caching & Search API           [0%]  [NOT STARTED]│
│    └─ Branch: feat/caching-and-api                          │
│    └─ Duration: 3-4 days                                    │
│                                                             │
│ ⬜ Stage 5: Frontend Auth Pages            [0%]  [NOT STARTED]│
│    └─ Branch: feat/frontend-auth                            │
│    └─ Duration: 2-3 days                                    │
│                                                             │
│ ⬜ Stage 6: Frontend Main Features         [0%]  [NOT STARTED]│
│    └─ Branch: feat/frontend-features                        │
│    └─ Duration: 5-6 days                                    │
│                                                             │
│ ⬜ Stage 7: Production Deployment          [0%]  [NOT STARTED]│
│    └─ Branch: feat/production-deployment                    │
│    └─ Duration: 3-4 days                                    │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ Overall Progress: ████░░░░░░░░░░░░░░░░░░░░░░░░░░░  1/7     │
└─────────────────────────────────────────────────────────────┘

Legend: ⬜ Not Started | 🔄 In Progress | ✅ Completed | ❌ Blocked
```

### Current Branch

```bash
# Update this when changing branches
Current: feat/authentication-system
Next: feat/search-infrastructure (after Stage 2 merge)
```

---

## Quick Start (5-Minute Setup)

### Prerequisites Check

```bash
# Verify Node.js version (18.17+ or 20.3+ required)
node --version

# Verify npm
npm --version

# Verify Docker is running
docker --version
docker compose version

# Verify PostgreSQL client (optional, for manual DB access)
psql --version
```

### First-Time Setup

```bash
# 1. Navigate to project
cd /home/bartek/apps/weekend

# 2. Check current status
git status
git branch

# 3. Review stage documentation
cat IMPLEMENTATION_STAGES.md | grep "Stage 1" -A 50

# 4. Verify no Docker containers running
docker ps

# 5. Ready to start Stage 1
echo "Ready to create feat/foundation-and-database branch"
```

### Resuming Work

```bash
# 1. Navigate to project
cd /home/bartek/apps/weekend

# 2. Check current branch and status
git status
git log --oneline -5

# 3. Start Docker if needed (from Stage 1+)
docker compose up -d

# 4. Verify database connection (if Stage 1 complete)
docker compose exec postgres psql -U weekend_user -d weekend_finder -c "\dt"

# 5. Start dev server (if Astro initialized)
npm run dev

# 6. Review WORK_CONTEXT.md status tracker above to see where you are
```

---

## Environment Configuration

### Stage 1: Foundation & Database

**Required before starting Stage 1:**

```bash
# No environment variables needed yet
# Docker Compose will handle PostgreSQL credentials
```

### Stage 2: Authentication System

**No new variables** - Auth uses database from Stage 1

### Stage 3: Search Infrastructure

**Required before starting Stage 3:**

Create `.env` file:

```bash
# Claude Agent SDK
ANTHROPIC_API_KEY=sk-ant-api03-...

# Serper API (Google Search)
SERPER_API_KEY=...

# Database (from docker-compose.yml)
DATABASE_URL=postgresql://weekend_user:local_dev_password@localhost:5432/weekend_finder
```

**How to get API keys:**

1. **Anthropic API Key:**
   - Visit: https://console.anthropic.com/
   - Create account or sign in
   - Go to "API Keys" section
   - Create new key (starts with `sk-ant-api03-`)

2. **Serper API Key:**
   - Visit: https://serper.dev/
   - Sign up with Google/GitHub
   - Dashboard → API Key
   - Copy key (2,500 free searches/month)

### Stage 4+: Additional Variables

```bash
# Session Secret (generate random string)
SESSION_SECRET=$(openssl rand -base64 32)

# Node Environment
NODE_ENV=development
```

### Full .env Template (All Stages)

```bash
# Database
DATABASE_URL=postgresql://weekend_user:local_dev_password@localhost:5432/weekend_finder

# Anthropic
ANTHROPIC_API_KEY=sk-ant-api03-...

# Serper API
SERPER_API_KEY=...

# Session
SESSION_SECRET=... # Generated via: openssl rand -base64 32

# App Config
NODE_ENV=development
PORT=4321
```

---

## Stage-by-Stage Context

### Stage 1: Foundation & Database ✅

**Branch:** `feat/foundation-and-database`
**Duration:** 3-4 days
**Dependencies:** None

**What You're Building:**
- Initialize Astro project with TypeScript
- Setup Docker Compose for PostgreSQL
- Configure Drizzle ORM
- Create database schema (users, sessions, search_cache)
- Setup environment configuration

**Key Files Created:**
```
package.json
astro.config.mjs
tsconfig.json
docker-compose.yml
src/db/
  ├── schema.ts
  ├── index.ts
  └── migrate.ts
drizzle.config.ts
.env.example
```

**Success Criteria:**
- ✅ `npm run dev` starts Astro server
- ✅ PostgreSQL running in Docker
- ✅ Database schema migrated successfully
- ✅ Can connect to database from Astro

**Testing Commands:**
```bash
# Verify database
docker compose exec postgres psql -U weekend_user -d weekend_finder -c "\dt"

# Should show: users, sessions, search_cache tables
```

---

### Stage 2: Authentication System 🔄

**Branch:** `feat/authentication-system`
**Duration:** 3-4 days
**Dependencies:** Stage 1 complete

**What You're Building:**
- Password hashing with Argon2
- Session management utilities
- Auth middleware
- Register, login, logout API endpoints

**Key Files Created:**
```
src/lib/auth/
  ├── password.ts
  ├── session.ts
  └── middleware.ts
src/pages/api/auth/
  ├── register.ts
  ├── login.ts
  └── logout.ts
```

**Success Criteria:**
- ✅ Can register new user via API
- ✅ Can login with correct credentials
- ✅ Sessions persist in database
- ✅ Logout clears session

**Testing Commands:**
```bash
# Test registration
curl -X POST http://localhost:4321/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"test123"}'

# Test login
curl -X POST http://localhost:4321/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"test123"}' \
  -c cookies.txt

# Test logout
curl -X POST http://localhost:4321/api/auth/logout \
  -b cookies.txt
```

---

### Stage 3: Search Infrastructure ⬜

**Branch:** `feat/search-infrastructure`
**Duration:** 4-5 days
**Dependencies:** Stage 2 complete

**What You're Building:**
- Serper API client for Google Search
- Claude Agent SDK integration
- Agent system prompt and tools
- Streaming response handler

**Key Files Created:**
```
src/lib/search/
  ├── serper.ts
  ├── agent.ts
  └── types.ts
```

**Success Criteria:**
- ✅ Serper API returns search results
- ✅ Claude Agent SDK initialized
- ✅ Agent can use web search tool
- ✅ Agent returns structured recommendations

**Testing Commands:**
```bash
# Test Serper API (Node script)
node -e "
const fetch = require('node-fetch');
fetch('https://google.serper.dev/search', {
  method: 'POST',
  headers: {
    'X-API-KEY': process.env.SERPER_API_KEY,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({q: 'test', num: 5})
}).then(r => r.json()).then(console.log);
"
```

---

### Stage 4: Caching & Search API ⬜

**Branch:** `feat/caching-and-api`
**Duration:** 3-4 days
**Dependencies:** Stage 3 complete

**What You're Building:**
- Cache key generation (SHA-256)
- Cache lookup and storage
- Main search API endpoint with SSE
- Search history endpoint

**Key Files Created:**
```
src/lib/cache/
  ├── keys.ts
  └── manager.ts
src/pages/api/
  ├── search.ts
  └── history.ts
```

**Success Criteria:**
- ✅ Search API accepts POST requests
- ✅ Cache prevents duplicate searches (48h TTL)
- ✅ SSE streams agent progress
- ✅ History endpoint returns past searches

**Testing Commands:**
```bash
# Test search API
curl -X POST http://localhost:4321/api/search \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "city": "Wrocław",
    "dateRangeStart": "2025-10-18",
    "dateRangeEnd": "2025-10-19",
    "attendees": [{"age": 5, "role": "child"}],
    "preferences": "climbing walls, active activities"
  }'

# Test history
curl http://localhost:4321/api/history -b cookies.txt
```

---

### Stage 5: Frontend Auth Pages ⬜

**Branch:** `feat/frontend-auth`
**Duration:** 2-3 days
**Dependencies:** Stage 2 complete

**What You're Building:**
- Login page with form
- Registration page
- Auth state management
- Protected route middleware

**Key Files Created:**
```
src/pages/
  ├── login.astro
  ├── register.astro
  └── index.astro (redirect logic)
src/components/
  └── AuthForm.astro
```

**Success Criteria:**
- ✅ Login form submits to /api/auth/login
- ✅ Registration form creates new user
- ✅ Authenticated users redirect to dashboard
- ✅ Unauthenticated users redirect to login

**Testing:**
- Manual browser testing at http://localhost:4321

---

### Stage 6: Frontend Main Features ⬜

**Branch:** `feat/frontend-features`
**Duration:** 5-6 days
**Dependencies:** Stages 4 & 5 complete

**What You're Building:**
- Dashboard with search history
- Search form with date picker
- Results page with streaming
- Responsive UI components

**Key Files Created:**
```
src/pages/
  ├── dashboard.astro
  ├── search.astro
  └── results.astro
src/components/
  ├── SearchForm.astro
  ├── ResultsStream.astro
  └── ActivityCard.astro
```

**Success Criteria:**
- ✅ Search form validates input
- ✅ Results stream in real-time
- ✅ History shows past searches
- ✅ Mobile responsive design

**Testing:**
- Manual browser testing with real searches

---

### Stage 7: Production Deployment ⬜

**Branch:** `feat/production-deployment`
**Duration:** 3-4 days
**Dependencies:** Stage 6 complete

**What You're Building:**
- Production Dockerfile
- Docker Compose for production
- Environment variable documentation
- DigitalOcean deployment guide

**Key Files Created:**
```
Dockerfile
docker-compose.prod.yml
.env.production.example
DEPLOYMENT.md
```

**Success Criteria:**
- ✅ Docker image builds successfully
- ✅ App runs in production mode
- ✅ DigitalOcean deployment successful
- ✅ Managed PostgreSQL connected

**Testing:**
```bash
# Build production image
docker build -t weekend-finder:latest .

# Run locally
docker compose -f docker-compose.prod.yml up
```

---

## Verification Commands

### Database Verification

```bash
# Check if Docker container is running
docker ps | grep weekend_finder_db

# Connect to PostgreSQL
docker compose exec postgres psql -U weekend_user -d weekend_finder

# List tables
\dt

# Check users table structure
\d users

# Count users
SELECT COUNT(*) FROM users;

# Check sessions
SELECT id, user_id, expires_at FROM sessions LIMIT 5;

# Check cache
SELECT id, city, date_range_start, access_count FROM search_cache LIMIT 5;

# Exit psql
\q
```

### API Verification

```bash
# Health check (create endpoint in Stage 1)
curl http://localhost:4321/api/health

# Auth status (after Stage 2)
curl http://localhost:4321/api/auth/status -b cookies.txt

# Search history (after Stage 4)
curl http://localhost:4321/api/history -b cookies.txt
```

### Application Verification

```bash
# Check Astro dev server
curl http://localhost:4321

# Check build
npm run build
npm run preview
```

---

## Command Reference

### Docker Commands

```bash
# Start PostgreSQL
docker compose up -d

# Stop PostgreSQL
docker compose down

# View logs
docker compose logs -f

# Restart database
docker compose restart postgres

# Remove volumes (CAUTION: deletes data)
docker compose down -v

# Execute SQL
docker compose exec postgres psql -U weekend_user -d weekend_finder -c "SELECT NOW();"
```

### Database Migration Commands

```bash
# Generate migration
npm run db:generate

# Push schema changes
npm run db:push

# Run migration
npm run db:migrate

# Drop database (CAUTION)
npm run db:drop

# Studio (GUI)
npm run db:studio
```

### Astro Commands

```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Check for errors
npm run astro check
```

### Git Workflow

```bash
# Create feature branch (e.g., Stage 1)
git checkout -b feat/foundation-and-database

# Check status
git status

# Commit changes
git add .
git commit -m "feat: implement foundation and database setup"

# Push to remote
git push origin feat/foundation-and-database

# After PR approval, merge to main
git checkout main
git pull origin main

# Create next stage branch
git checkout -b feat/authentication-system
```

---

## Common Issues & Solutions

### Issue: Docker PostgreSQL won't start

**Symptoms:**
```
Error: port 5432 already in use
```

**Solutions:**
```bash
# Check if PostgreSQL is already running locally
sudo systemctl status postgresql
sudo systemctl stop postgresql

# Or use different port in docker-compose.yml
ports:
  - "5433:5432"  # Change DATABASE_URL to use 5433
```

---

### Issue: Database connection refused

**Symptoms:**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solutions:**
```bash
# Verify container is running
docker ps | grep postgres

# Check logs
docker compose logs postgres

# Restart container
docker compose restart postgres

# Verify connection from host
docker compose exec postgres psql -U weekend_user -d weekend_finder -c "SELECT 1;"
```

---

### Issue: Drizzle migrations fail

**Symptoms:**
```
Error: relation "users" already exists
```

**Solutions:**
```bash
# Drop all tables and re-migrate
docker compose exec postgres psql -U weekend_user -d weekend_finder -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Re-run migrations
npm run db:push
```

---

### Issue: Astro dev server not starting

**Symptoms:**
```
Error: Cannot find module '@astrojs/node'
```

**Solutions:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Verify package.json has correct dependencies
cat package.json | grep @astrojs
```

---

### Issue: API returns 401 Unauthorized

**Symptoms:**
```bash
curl http://localhost:4321/api/history
# {"error": "Unauthorized"}
```

**Solutions:**
```bash
# Verify session cookie exists
curl http://localhost:4321/api/auth/status -b cookies.txt

# Re-login
curl -X POST http://localhost:4321/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"test123"}' \
  -c cookies.txt
```

---

### Issue: Serper API returns 401

**Symptoms:**
```
Error: Unauthorized - Invalid API Key
```

**Solutions:**
```bash
# Verify API key in .env
cat .env | grep SERPER_API_KEY

# Test directly
curl -X POST https://google.serper.dev/search \
  -H "X-API-KEY: $SERPER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"q": "test"}'

# Check quota at https://serper.dev/dashboard
```

---

### Issue: Claude Agent SDK timeout

**Symptoms:**
```
Error: Request timeout after 30000ms
```

**Solutions:**
```bash
# Increase timeout in agent.ts
const response = await agent.run({
  // ...
  timeout: 60000  // 60 seconds
});

# Verify Anthropic API key
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{"model":"claude-haiku-4.5-20250410","max_tokens":1024,"messages":[{"role":"user","content":"test"}]}'
```

---

## Workflow for Each Stage

### Standard Stage Workflow

**Follow these steps for each stage:**

1. **Pre-Stage Checklist**
   ```bash
   # Verify previous stage is complete
   git log --oneline -5

   # Pull latest main
   git checkout main
   git pull origin main

   # Review stage documentation
   cat IMPLEMENTATION_STAGES.md | grep "Stage X" -A 100
   ```

2. **Create Feature Branch**
   ```bash
   # Example for Stage 1
   git checkout -b feat/foundation-and-database

   # Update WORK_CONTEXT.md status tracker
   # Change Stage 1 from ⬜ to 🔄
   ```

3. **Implementation**
   - Follow step-by-step instructions in IMPLEMENTATION_STAGES.md
   - Refer to HANDOFF.md for detailed code examples
   - Commit frequently with descriptive messages
   - Test after each logical unit of work

4. **Testing**
   - Run all verification commands from IMPLEMENTATION_STAGES.md
   - Test manually in browser (for frontend stages)
   - Document any issues in PR description

5. **Commit & Push**
   ```bash
   git add .
   git commit -m "feat: implement [stage description]"
   git push origin feat/[branch-name]
   ```

6. **Create Pull Request**
   - Open PR from feature branch to main
   - Use PR template (title: "Stage X: [description]")
   - Include testing checklist in description
   - Notify reviewer

7. **Post-Merge**
   ```bash
   # After PR approval and merge
   git checkout main
   git pull origin main

   # Update WORK_CONTEXT.md status tracker
   # Change Stage X from 🔄 to ✅

   # Verify merged changes work
   npm install  # if package.json changed
   npm run dev
   ```

---

### Example: Stage 1 Workflow

```bash
# 1. Start from clean main
git checkout main
git pull origin main

# 2. Create branch
git checkout -b feat/foundation-and-database

# 3. Initialize Astro
npm create astro@latest . -- --template minimal --typescript strict --install

# 4. Setup Docker
# Create docker-compose.yml
# Start container
docker compose up -d

# 5. Install Drizzle
npm install drizzle-orm postgres
npm install -D drizzle-kit

# 6. Create database schema
# Create src/db/schema.ts
# Create src/db/index.ts

# 7. Run migration
npm run db:push

# 8. Test
docker compose exec postgres psql -U weekend_user -d weekend_finder -c "\dt"

# 9. Commit
git add .
git commit -m "feat: implement foundation and database setup

- Initialize Astro with TypeScript
- Setup Docker Compose for PostgreSQL
- Configure Drizzle ORM
- Create database schema (users, sessions, search_cache)
- Add migration scripts"

# 10. Push
git push origin feat/foundation-and-database

# 11. Create PR and wait for review
```

---

## Stage Transition Checklist

### Before Starting New Stage

```bash
☐ Previous stage PR merged to main
☐ Checked out latest main branch
☐ All tests passing from previous stage
☐ Docker containers running (if needed)
☐ Environment variables configured (if needed)
☐ Read next stage documentation in IMPLEMENTATION_STAGES.md
☐ Updated WORK_CONTEXT.md status tracker
☐ Created feature branch for new stage
```

### Before Creating PR

```bash
☐ All files committed with descriptive messages
☐ Ran all verification commands from IMPLEMENTATION_STAGES.md
☐ Manual testing completed (for frontend/API stages)
☐ No console errors in browser (for frontend stages)
☐ Database migrations successful (if applicable)
☐ Code follows Drupal 10 best practices (per CLAUDE.md)
☐ PR description includes testing checklist
☐ Branch pushed to remote
```

### After PR Merge

```bash
☐ Checked out main branch
☐ Pulled latest changes
☐ Verified merged code works locally
☐ Updated WORK_CONTEXT.md status tracker (mark stage complete)
☐ Ran full verification suite
☐ Ready to start next stage
```

---

## Quick Reference: Stage Dependencies

```
Stage 1: Foundation & Database
  └─ No dependencies

Stage 2: Authentication System
  └─ Requires: Stage 1 (database)

Stage 3: Search Infrastructure
  └─ Requires: Stage 1 (database)
  └─ Requires: API keys (Anthropic, Serper)

Stage 4: Caching & Search API
  └─ Requires: Stage 2 (auth middleware)
  └─ Requires: Stage 3 (agent & search)

Stage 5: Frontend Auth Pages
  └─ Requires: Stage 2 (auth endpoints)

Stage 6: Frontend Main Features
  └─ Requires: Stage 4 (search API)
  └─ Requires: Stage 5 (auth pages)

Stage 7: Production Deployment
  └─ Requires: Stage 6 (complete app)
```

---

## Emergency Recovery Commands

### If Everything Breaks

```bash
# 1. Stop all containers
docker compose down

# 2. Remove node_modules
rm -rf node_modules package-lock.json

# 3. Clean Docker volumes (CAUTION: deletes data)
docker compose down -v

# 4. Reinstall dependencies
npm install

# 5. Restart Docker
docker compose up -d

# 6. Re-run migrations
npm run db:push

# 7. Restart dev server
npm run dev
```

### If Database is Corrupted

```bash
# 1. Stop container
docker compose down

# 2. Remove volume
docker volume rm weekend_postgres_data

# 3. Restart
docker compose up -d

# 4. Recreate schema
npm run db:push

# 5. Verify
docker compose exec postgres psql -U weekend_user -d weekend_finder -c "\dt"
```

---

## Notes & Tips

### Development Best Practices

1. **Commit Often:** Small, focused commits are easier to review and revert
2. **Test Before Committing:** Run verification commands before each commit
3. **Follow Naming Conventions:** Use feat/, fix/, chore/ prefixes for branches
4. **Document Decisions:** Add comments for non-obvious code
5. **Keep .env Updated:** Always update .env.example when adding new variables

### Performance Tips

1. **Cache Aggressively:** 48-hour TTL prevents duplicate API calls
2. **Use Haiku 4.5:** 60% cheaper than Sonnet with similar quality for structured tasks
3. **Limit Search Results:** Serper's `num: 10` parameter balances quality vs. cost
4. **Database Indexes:** Ensure indexes on frequently queried columns (user_id, cache_key)

### Security Reminders

1. **Never Commit .env:** Always in .gitignore
2. **Use Strong Session Secrets:** Generate with `openssl rand -base64 32`
3. **Validate All Input:** Check user input before database queries
4. **Set Session Expiry:** 7 days max, refresh on activity
5. **Use HTTPS in Production:** Enforce via Caddy or DigitalOcean App Platform

---

## Contact & Support

- **Project Documentation:** See PRD.md, HANDOFF.md, IMPLEMENTATION_STAGES.md
- **API Documentation:**
  - Anthropic: https://docs.anthropic.com/
  - Serper: https://serper.dev/docs
- **Framework Docs:**
  - Astro: https://docs.astro.build/
  - Drizzle ORM: https://orm.drizzle.team/

---

**Last Updated:** 2025-10-18
**Current Stage:** Stage 2 - Authentication System
**Status:** In Progress 🔄
