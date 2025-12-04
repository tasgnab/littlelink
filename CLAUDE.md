# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A modern link shortener built with Next.js 16, React 19, Drizzle ORM, PostgreSQL, and TailwindCSS. Uses a Backend-for-Frontend (BFF) pattern with Next.js API routes. Single-user application secured with NextAuth.js Google OAuth.

## Development Commands

```bash
# Development
npm run dev                 # Start Next.js dev server on http://localhost:3000
npm run build              # Build for production
npm start                  # Start production server
npm run lint               # Run ESLint

# Database
npm run db:push            # Push schema to database (use in development)
npm run db:generate        # Generate migrations from schema
npm run db:migrate         # Apply migrations to database
npm run db:studio          # Open Drizzle Studio GUI at https://local.drizzle.studio
```

## Architecture

### BFF Pattern
All API routes are in `app/api/` and serve as the Backend-for-Frontend. No separate backend server exists. API routes handle authentication, database queries, and business logic.

### Authentication Flow
- NextAuth.js configured in `lib/auth.ts` with Drizzle adapter
- Google OAuth provider with single-user restriction via `ALLOWED_USER_EMAIL` env var
- Session-based authentication stored in PostgreSQL
- Middleware (`middleware.ts`) protects all routes except:
  - `/auth/*` - Authentication pages
  - `/s/*` - Public short link redirects
  - `/api/public/*` - Public API endpoints (for API key auth)

### Database Schema (`lib/db/schema.ts`)
- **users, accounts, sessions**: NextAuth tables
- **links**: URL mappings with shortCode (unique), clicks counter, active status, and optional expiration
- **clicks**: Click tracking with timestamp, referer, user agent, IP, device, browser, OS
- **apiKeys**: API key management for programmatic access

Indexes: `shortCode`, `userId` on links; `linkId`, `timestamp` on clicks

### Short Link Redirect (`app/s/[shortCode]/route.ts`)
- GET handler validates link (exists, active, not expired)
- Returns HTML error pages (404, 410) with styled error messages
- Tracks clicks asynchronously (fire-and-forget) to avoid slowing redirects
- Parses user agent with `parseUserAgent()` utility for device/browser/OS
- Performs 302 redirect to original URL

### Validation (`lib/validations.ts`)
All API inputs validated with Zod schemas:
- `createLinkSchema`: URL, optional shortCode (3-20 chars, alphanumeric + hyphens/underscores), optional title/description/expiresAt
- `updateLinkSchema`: Partial updates to links
- `createApiKeySchema`: API key naming
- `bulkDeleteSchema`: Array of UUIDs for batch deletion

### Short Code Generation (`lib/utils.ts`)
- Uses `nanoid` for collision-resistant short codes (default 6 chars)
- Auto-generated codes checked for uniqueness with retry loop
- Custom codes validated against schema and checked for conflicts

## Environment Variables

Required variables in `.env`:
- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_URL`: Application URL (e.g., http://localhost:3000)
- `NEXTAUTH_SECRET`: Random secret for session signing (generate with `openssl rand -base64 32`)
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`: Google OAuth credentials
- `NEXT_PUBLIC_APP_URL`: Public-facing app URL for link generation
- `ALLOWED_USER_EMAIL`: Single email address allowed to authenticate

## Import Aliases

TypeScript path alias `@/*` maps to project root (configured in `tsconfig.json`).

Example: `import { db } from "@/lib/db"`

## API Endpoints

### Links
- `GET /api/links?limit=50&offset=0` - Paginated list of user's links
- `POST /api/links` - Create link (auto-generates shortCode if not provided)
- `GET /api/links/[id]` - Get single link
- `PATCH /api/links/[id]` - Update link (url, title, description, isActive, expiresAt)
- `DELETE /api/links/[id]` - Delete single link
- `DELETE /api/links` - Bulk delete with `{ linkIds: [...] }`
- `GET /api/links/[id]/qr` - Generate QR code for link

### Analytics
- `GET /api/analytics/[linkId]?days=30` - Get click analytics for specified time period

### API Keys
- `GET /api/api-keys` - List user's API keys
- `POST /api/api-keys` - Create new API key (generates `sk_` prefixed key)
- `DELETE /api/api-keys?id=[id]` - Delete API key

## Database Setup

1. Create PostgreSQL database: `createdb linkshortener`
2. Push schema: `npm run db:push`
3. For production, use migrations: `npm run db:generate && npm run db:migrate`

## Common Patterns

### Route Handler Structure
All API routes follow pattern:
1. Authenticate with `await auth()`
2. Validate input with Zod `.safeParse()`
3. Execute database query with Drizzle
4. Return `NextResponse.json()` with appropriate status

### Error Handling
Return JSON errors with descriptive messages and proper HTTP status codes (400 for validation, 401 for auth, 404 for not found, 409 for conflicts, 500 for server errors).

### Click Tracking
Always use fire-and-forget pattern (no await) to avoid blocking redirects. Log errors but don't fail the request if tracking fails.
