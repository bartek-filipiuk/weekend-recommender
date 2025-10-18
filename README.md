# Weekend Finder

AI-powered weekend activity finder for parents. Built with Astro, PostgreSQL, Claude Agent SDK, and Serper API.

## Quick Start

### Prerequisites

- Node.js 18.17+ or 20.3+
- Docker and Docker Compose
- npm or yarn

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy environment file
cp .env.example .env

# 3. Start PostgreSQL
docker compose up -d

# 4. Run database migrations
npm run db:migrate

# 5. Start development server
npm run dev
```

## Project Structure

```
weekend-finder/
├── src/
│   ├── db/
│   │   ├── schema.ts       # Database schema definitions
│   │   ├── index.ts        # Database connection
│   │   └── migrate.ts      # Migration script
│   ├── pages/
│   │   ├── api/
│   │   │   └── health.ts   # Health check endpoint
│   │   └── index.astro     # Landing page
│   └── env.d.ts           # TypeScript environment types
├── drizzle/               # Generated migrations
├── docker-compose.yml     # PostgreSQL container config
├── .env                   # Environment variables
└── package.json
```

## Database Schema

- **users**: User authentication data
- **sessions**: Active user sessions
- **search_cache**: Cached search results (48h TTL)

## Available Scripts

```bash
npm run dev          # Start Astro dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run db:generate  # Generate migration files
npm run db:push      # Push schema to database (interactive)
npm run db:migrate   # Run migrations
npm run db:studio    # Open Drizzle Studio
```

## API Endpoints

### Health Check

```bash
curl http://localhost:4321/api/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2025-10-18T08:00:00.000Z",
  "database": {
    "connected": true,
    "serverTime": "2025-10-18 08:00:00+00"
  },
  "environment": "development"
}
```

## Development

### Docker PostgreSQL

The PostgreSQL database runs in Docker on port **5436** (configured to avoid conflicts with local PostgreSQL).

```bash
# Start database
docker compose up -d

# View logs
docker compose logs -f

# Stop database
docker compose down

# Reset database (CAUTION: deletes all data)
docker compose down -v
```

### Database Management

```bash
# Connect to PostgreSQL
docker compose exec postgres psql -U weekend_user -d weekend_finder

# List tables
\dt

# Describe table
\d users

# Exit
\q
```

## Current Implementation Status

### ✅ Stage 1: Foundation & Database (COMPLETE)

- [x] Astro project initialization
- [x] Docker Compose for PostgreSQL
- [x] Drizzle ORM configuration
- [x] Database schema (users, sessions, search_cache)
- [x] Migration system
- [x] Health check endpoint

### 🔄 Next: Stage 2 - Authentication System

See [IMPLEMENTATION_STAGES.md](./IMPLEMENTATION_STAGES.md) for full roadmap.

## Documentation

- **[PRD.md](./PRD.md)** - Product Requirements Document
- **[HANDOFF.md](./HANDOFF.md)** - Implementation Guide
- **[IMPLEMENTATION_STAGES.md](./IMPLEMENTATION_STAGES.md)** - PR Stages
- **[WORK_CONTEXT.md](./WORK_CONTEXT.md)** - Developer Context Guide

## Tech Stack

- **Frontend**: Astro 4.x (SSR)
- **Database**: PostgreSQL 16 + Drizzle ORM
- **AI**: Claude Haiku 4.5 (via Agent SDK) *(Stage 3)*
- **Search**: Serper API *(Stage 3)*
- **Auth**: Argon2 + Sessions *(Stage 2)*
- **Deployment**: DigitalOcean *(Stage 7)*

## License

MIT
