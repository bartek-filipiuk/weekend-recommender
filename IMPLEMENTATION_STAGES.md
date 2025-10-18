# 🚀 Weekend Finder - Implementation Stages (PR Strategy)

**Total Duration:** 4 weeks
**Number of PRs:** 7 major stages
**Strategy:** Each stage is a complete, testable unit of work

---

## 📦 Stage 1: Project Foundation & Database Setup
**Duration:** 3-4 days | **PR:** `feat/foundation-and-database`

### Scope
Set up the project structure, Docker environment, and database with migrations.

### Deliverables
- [ ] Astro project initialized with TypeScript strict mode
- [ ] Docker Compose for local PostgreSQL
- [ ] Drizzle ORM configured
- [ ] All 3 database tables created (users, sessions, search_cache)
- [ ] Migrations working
- [ ] Environment configuration (.env.example, .env.local)

### Files Created
```
├── astro.config.mjs
├── package.json (with all dependencies)
├── tsconfig.json
├── docker-compose.yml
├── .dockerignore
├── .env.example
├── .env.local (gitignored)
├── drizzle.config.ts
├── src/
│   └── lib/
│       └── db/
│           ├── index.ts (connection)
│           └── schema.ts (all tables)
└── database/
    └── migrations/ (generated)
```

### Testing Checklist
- [ ] `npm install` succeeds without errors
- [ ] `docker-compose up -d postgres` starts PostgreSQL
- [ ] `npx drizzle-kit generate:pg` generates migrations
- [ ] `npx drizzle-kit push:pg` creates tables
- [ ] Can connect to database: `docker exec -it weekend_finder_db psql -U weekend_user -d weekend_finder -c "\dt"`
- [ ] See all 3 tables listed

### Acceptance Criteria
- Database is running in Docker
- All tables exist with correct schema
- No errors in console
- Can run migrations repeatedly (idempotent)

---

## 🔐 Stage 2: Authentication System
**Duration:** 3-4 days | **PR:** `feat/authentication-system`

### Scope
Complete user authentication with registration, login, logout, and session management.

### Dependencies
- Stage 1 (database must be set up)

### Deliverables
- [ ] Password hashing utilities (argon2)
- [ ] Session management (create, validate, delete)
- [ ] Registration API endpoint
- [ ] Login API endpoint
- [ ] Logout API endpoint
- [ ] Session validation middleware

### Files Created
```
src/
├── lib/
│   └── auth/
│       ├── password.ts
│       └── session.ts
└── pages/
    └── api/
        └── auth/
            ├── register.ts
            ├── login.ts
            └── logout.ts
```

### Testing Checklist

**Registration:**
```bash
curl -X POST http://localhost:4321/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}'
# Expected: {"success":true,"userId":1,"username":"testuser"}
```

**Login:**
```bash
curl -X POST http://localhost:4321/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}' \
  -c cookies.txt
# Expected: {"success":true,"userId":1,"username":"testuser"}
# Check: cookies.txt contains session cookie
```

**Logout:**
```bash
curl -X POST http://localhost:4321/api/auth/logout \
  -b cookies.txt
# Expected: {"success":true}
```

**Validation:**
- [ ] Cannot register with duplicate username (409 error)
- [ ] Cannot register with short username (<3 chars)
- [ ] Cannot register with short password (<8 chars)
- [ ] Invalid login returns 401
- [ ] Session persists across requests
- [ ] Session in database has correct expiry (7 days)

### Acceptance Criteria
- All 3 auth endpoints working
- Sessions stored in database
- Passwords hashed (never stored plain)
- Session cookies are HTTP-only and secure
- Input validation works

---

## 🔍 Stage 3: Search Infrastructure (Backend Only)
**Duration:** 4-5 days | **PR:** `feat/search-infrastructure`

### Scope
Integrate Serper API and Claude Agent SDK for search functionality (no UI yet).

### Dependencies
- Stage 1 (database)

### Deliverables
- [ ] Serper API integration (custom tool)
- [ ] Claude Agent SDK configuration
- [ ] Search prompt template
- [ ] Agent search execution with streaming
- [ ] Response parsing logic

### Files Created
```
src/
└── lib/
    └── agent/
        ├── config.ts
        ├── prompts.ts
        ├── search.ts
        └── tools/
            └── serper-search.ts
```

### Testing Checklist

**Test Serper API directly:**
```bash
curl -X POST https://google.serper.dev/search \
  -H "X-API-KEY: your-key" \
  -H "Content-Type: application/json" \
  -d '{"q":"Wrocław weekend activities","num":10,"gl":"pl","hl":"pl"}'
# Expected: JSON with search results
```

**Test Agent SDK (create test script):**
```typescript
// scripts/test-agent.ts
import { performSearch } from '../src/lib/agent/search';

const testParams = {
  city: 'Wrocław',
  dateRange: { start: '2025-10-18', end: '2025-10-19' },
  attendees: 'family with 5yo kid',
  preferences: 'indoor activities'
};

performSearch(testParams, (status, msg) => {
  console.log(`[${status}] ${msg}`);
}).then(results => {
  console.log('Results:', JSON.stringify(results, null, 2));
});
```

Run: `tsx scripts/test-agent.ts`

**Validation:**
- [ ] Serper tool returns formatted search results
- [ ] Agent SDK successfully calls Serper tool
- [ ] Progress callbacks fire during search
- [ ] Search returns 3-5 recommendations
- [ ] Token usage is tracked
- [ ] Search count is tracked

### Acceptance Criteria
- Serper API integration works
- Agent SDK configured with Haiku 4.5
- Can perform search and get recommendations
- Response parsing extracts structured data
- All metadata (tokens, search count) captured

---

## 💾 Stage 4: Caching & Search API
**Duration:** 3-4 days | **PR:** `feat/caching-and-search-api`

### Scope
Implement caching system and expose search via API with SSE streaming.

### Dependencies
- Stage 2 (authentication for session validation)
- Stage 3 (search infrastructure)

### Deliverables
- [ ] Cache key generation
- [ ] Cache lookup and storage
- [ ] Search API endpoint with SSE streaming
- [ ] Session-based authorization
- [ ] Cache expiry (48 hours)

### Files Created
```
src/
├── lib/
│   └── cache/
│       ├── keys.ts
│       └── manager.ts
└── pages/
    └── api/
        └── search.ts
```

### Testing Checklist

**First search (cache miss):**
```bash
# Login first to get session cookie
curl -X POST http://localhost:4321/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}' \
  -c cookies.txt

# Perform search
curl -X POST http://localhost:4321/api/search \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "city":"Wrocław",
    "dateRange":{"start":"2025-10-18","end":"2025-10-19"},
    "attendees":"family with 5yo",
    "preferences":"active indoor"
  }'

# Expected: SSE stream with progress updates, then results
# data: {"status":"searching","message":"Searching web..."}
# data: {"status":"complete","data":{...recommendations...}}
```

**Second search (cache hit):**
```bash
# Same search again
curl -X POST http://localhost:4321/api/search \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "city":"Wrocław",
    "dateRange":{"start":"2025-10-18","end":"2025-10-19"},
    "attendees":"family with 5yo",
    "preferences":"active indoor"
  }'

# Expected: Instant response (no SSE), cached:true
```

**Validation:**
- [ ] First search performs API calls and streams progress
- [ ] Results stored in search_cache table
- [ ] Second identical search returns instantly from cache
- [ ] Cache key is consistent for same params
- [ ] Different params generate different cache keys
- [ ] Unauthorized requests return 401

**Check database:**
```sql
SELECT id, city, cached_at, expires_at, access_count
FROM search_cache;
```

### Acceptance Criteria
- Search API endpoint works with SSE
- Cache hit/miss logic correct
- 48-hour TTL enforced
- Session validation required
- Access count increments on cache hits

---

## 🎨 Stage 5: Frontend - Authentication Pages
**Duration:** 2-3 days | **PR:** `feat/frontend-auth-pages`

### Scope
Build login and registration pages with form handling.

### Dependencies
- Stage 2 (auth API endpoints)

### Deliverables
- [ ] Base layout component
- [ ] Registration page with form
- [ ] Login page with form
- [ ] Client-side form validation
- [ ] Error handling and display
- [ ] Redirect after successful auth

### Files Created
```
src/
├── layouts/
│   └── Layout.astro
└── pages/
    ├── register.astro
    ├── login.astro
    └── index.astro (landing page)
```

### Testing Checklist

**Registration Page:**
- [ ] Visit http://localhost:4321/register
- [ ] Form displays correctly
- [ ] Can type username and password
- [ ] Submit button works
- [ ] Error shows if username too short
- [ ] Error shows if password too short
- [ ] Error shows if username exists
- [ ] Success redirects to /dashboard (create placeholder)
- [ ] Mobile responsive

**Login Page:**
- [ ] Visit http://localhost:4321/login
- [ ] Form displays correctly
- [ ] Submit button works
- [ ] Error shows for invalid credentials
- [ ] Success redirects to /dashboard
- [ ] Mobile responsive

**Cross-browser:**
- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari (if on Mac)

### Acceptance Criteria
- Registration page fully functional
- Login page fully functional
- Forms have validation
- Errors display clearly
- Successful auth redirects correctly
- Pages are mobile-responsive

---

## 🏠 Stage 6: Frontend - Dashboard, Search & Results
**Duration:** 5-6 days | **PR:** `feat/frontend-main-features`

### Scope
Build the main application pages: dashboard, search form, and results display.

### Dependencies
- Stage 4 (search API)
- Stage 5 (auth pages for navigation flow)

### Deliverables
- [ ] Dashboard page with user info and recent searches
- [ ] Search form with all fields
- [ ] Results page with ranked cards
- [ ] Copy to clipboard functionality
- [ ] Loading states and progress indicators
- [ ] Navigation between pages
- [ ] Search history display

### Files Created
```
src/
├── pages/
│   ├── dashboard.astro
│   ├── search.astro
│   ├── results/
│   │   └── [id].astro
│   └── history.astro
└── components/
    ├── SearchForm.astro
    ├── RecommendationCard.astro
    ├── LoadingSpinner.astro
    └── ProgressBar.astro
```

### Testing Checklist

**Dashboard:**
- [ ] Visit http://localhost:4321/dashboard (after login)
- [ ] Shows "New Search" button
- [ ] Shows recent searches (if any)
- [ ] Shows user info (username)
- [ ] Logout button works
- [ ] Click "New Search" → redirects to /search

**Search Form:**
- [ ] All fields present (city, dates, attendees, preferences)
- [ ] Date picker works
- [ ] Form validation (required fields)
- [ ] Submit triggers search
- [ ] Shows loading spinner
- [ ] Progress updates via SSE (e.g., "Searching...", "Analyzing...")
- [ ] Mobile responsive

**Results Page:**
- [ ] Displays 3-5 recommendation cards
- [ ] Each card shows: rank, name, description, location, cost, reasoning
- [ ] Cards ranked (🥇 #1, 🥈 #2, 🥉 #3)
- [ ] "Copy All" button works
- [ ] Clipboard contains formatted text
- [ ] "New Search" button returns to search form
- [ ] Mobile responsive (cards stack vertically)

**Search History:**
- [ ] Shows last 10 searches
- [ ] Shows city, date, attendees, created date
- [ ] Click search → loads cached results
- [ ] Shows "expired" for old searches

**Flow Test:**
1. Login
2. Dashboard → New Search
3. Fill form → Submit
4. See progress updates
5. Results appear
6. Copy to clipboard (paste in notepad to verify)
7. Back to dashboard
8. See search in recent list
9. Perform same search again → instant results (cached)

### Acceptance Criteria
- Complete user flow works end-to-end
- All pages mobile-responsive
- SSE progress updates display correctly
- Copy to clipboard works
- Cache hit shows instant results
- UI is polished and user-friendly

---

## 🚀 Stage 7: Production Deployment & Monitoring
**Duration:** 3-4 days | **PR:** `feat/production-deployment`

### Scope
Production-ready Docker setup, deployment configurations, and monitoring scripts.

### Dependencies
- All previous stages (complete MVP)

### Deliverables
- [ ] Production Dockerfile (multi-stage build)
- [ ] Caddyfile for reverse proxy
- [ ] docker-compose.prod.yml
- [ ] DigitalOcean deployment guide
- [ ] Cost monitoring script
- [ ] Cache cleanup script
- [ ] Production environment configuration
- [ ] README.md with deployment instructions

### Files Created
```
├── Dockerfile
├── Caddyfile
├── docker-compose.prod.yml
├── .do/
│   └── app.yaml (DigitalOcean App Platform spec)
├── scripts/
│   ├── cost-monitor.ts
│   └── cleanup-cache.ts
├── README.md
└── DEPLOYMENT.md
```

### Pre-Deployment Checklist

**Local Production Build:**
- [ ] `docker build -t weekend-finder .` succeeds
- [ ] Image size reasonable (<500MB)
- [ ] Container starts: `docker run -p 4321:4321 weekend-finder`
- [ ] Health check endpoint responds

**Environment Variables:**
- [ ] All required vars documented in .env.example
- [ ] Production .env template created
- [ ] Secrets management plan documented

**Security:**
- [ ] No API keys in code
- [ ] No passwords in Git history
- [ ] .env* in .gitignore
- [ ] Dependencies have no critical vulnerabilities: `npm audit`

### Deployment Checklist

**DigitalOcean Setup:**
- [ ] Create DigitalOcean account
- [ ] Create Managed PostgreSQL database
- [ ] Note connection string
- [ ] Create App Platform app OR provision Droplet
- [ ] Configure environment variables
- [ ] Deploy application
- [ ] Run database migrations in production

**Post-Deployment Testing:**
- [ ] Visit https://your-domain.com
- [ ] HTTPS works (SSL certificate valid)
- [ ] Register new user
- [ ] Login works
- [ ] Perform search
- [ ] Results appear
- [ ] Check database (verify data persisted)
- [ ] Check logs (no errors)

**Monitoring:**
- [ ] Cost monitoring script runs: `node scripts/cost-monitor.js`
- [ ] Shows estimated monthly cost
- [ ] Cache cleanup cron configured
- [ ] Test cron: manually run `node scripts/cleanup-cache.js`

**Documentation:**
- [ ] README.md has setup instructions
- [ ] DEPLOYMENT.md has production deploy steps
- [ ] API endpoints documented
- [ ] Troubleshooting section added

### Acceptance Criteria
- App deployed to production
- HTTPS working
- Database migrations complete
- All features work in production
- Cost monitoring active
- Documentation complete

---

## 📊 Implementation Timeline

```
Week 1:
  Days 1-4:   Stage 1 (Foundation & Database)
  Days 5-7:   Stage 2 (Authentication)

Week 2:
  Days 8-12:  Stage 3 (Search Infrastructure)
  Days 13-14: Stage 4 (Caching & API)

Week 3:
  Days 15-17: Stage 5 (Auth Pages)
  Days 18-21: Stage 6 (Main Features)

Week 4:
  Days 22-25: Stage 7 (Production Deployment)
  Days 26-28: Testing, fixes, launch
```

---

## 🔄 Pull Request Strategy

### PR Template

```markdown
## Stage X: [Feature Name]

### What
Brief description of what this PR implements.

### Why
Why this stage is needed.

### How to Test
1. Step-by-step testing instructions
2. Expected outcomes
3. Screenshots (if UI changes)

### Checklist
- [ ] All files from stage spec included
- [ ] Tests pass (manual checklist completed)
- [ ] No console errors
- [ ] Documentation updated (if needed)
- [ ] Ready for review

### Dependencies
- Depends on: PR #X (if applicable)
- Blocks: PR #Y (if applicable)

### Screenshots (if applicable)
[Attach screenshots of UI changes]
```

### Review Guidelines

**For Each PR:**
1. **Code Review**: Check code quality, security, best practices
2. **Manual Testing**: Reviewer follows testing checklist
3. **Documentation**: Ensure README/comments updated if needed
4. **Approval**: Require 1 approval (or self-approve for solo dev)
5. **Merge**: Squash merge to main (keeps history clean)

**Branch Naming:**
- `feat/foundation-and-database`
- `feat/authentication-system`
- `feat/search-infrastructure`
- etc.

---

## 🎯 Success Metrics per Stage

| Stage | Lines of Code | Files | API Endpoints | Pages | Estimated Effort |
|-------|--------------|-------|---------------|-------|------------------|
| 1     | ~200         | 5     | 0             | 0     | 3-4 days         |
| 2     | ~400         | 5     | 3             | 0     | 3-4 days         |
| 3     | ~500         | 4     | 0             | 0     | 4-5 days         |
| 4     | ~300         | 3     | 1             | 0     | 3-4 days         |
| 5     | ~200         | 3     | 0             | 2     | 2-3 days         |
| 6     | ~800         | 8     | 0             | 4     | 5-6 days         |
| 7     | ~300         | 7     | 0             | 0     | 3-4 days         |
| **Total** | **~2,700** | **35** | **4** | **6** | **23-30 days** |

---

## 🚦 Stage Dependencies Graph

```
Stage 1 (Foundation)
    ↓
    ├─→ Stage 2 (Auth) ─────┐
    │                       ↓
    └─→ Stage 3 (Search) ──→ Stage 4 (Caching + API)
                                ↓
                Stage 2 ────→ Stage 5 (Auth Pages)
                                ↓
                Stage 4 ────→ Stage 6 (Main Pages)
                                ↓
                            Stage 7 (Production)
```

**Parallelization Opportunities:**
- After Stage 1: Can work on Stage 2 and Stage 3 in parallel (different developers)
- After Stage 4: Can work on Stage 5 independently

---

## 📝 Quick Start

```bash
# Start with Stage 1
git checkout -b feat/foundation-and-database
# Follow HANDOFF.md "Week 1: Day 1-2" section
# Complete Stage 1 checklist
git add .
git commit -m "feat: project foundation and database setup"
git push origin feat/foundation-and-database
# Create PR, get reviewed, merge

# Move to Stage 2
git checkout main
git pull origin main
git checkout -b feat/authentication-system
# Continue...
```

---

## 🎓 Learning Path

Each stage teaches specific skills:

1. **Stage 1**: Docker, PostgreSQL, Drizzle ORM, migrations
2. **Stage 2**: Authentication, session management, security
3. **Stage 3**: API integration, Agent SDK, TypeScript generics
4. **Stage 4**: Caching strategies, SSE streaming, async patterns
5. **Stage 5**: Astro components, forms, client-side JavaScript
6. **Stage 6**: Complex UI, state management, UX design
7. **Stage 7**: DevOps, Docker production, monitoring

---

**Ready to start?** Begin with [Stage 1](#-stage-1-project-foundation--database-setup) and follow the checklist! 🚀
