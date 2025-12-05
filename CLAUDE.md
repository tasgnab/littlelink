# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LittleLink is a self-hosted URL shortener built with Next.js 16 (App Router), featuring:
- Single-user authentication via Google OAuth (email-restricted)
- PostgreSQL database with Drizzle ORM
- Comprehensive click analytics and tracking
- Tags system for organizing links
- QR code generation

## Development Commands

```bash
# Development
npm run dev          # Start Next.js dev server with Turbopack

# Database
npm run db:push      # Push schema changes directly (for development)
npm run db:generate  # Generate migration files
npm run db:migrate   # Run migrations (for production)
npm run db:studio    # Open Drizzle Studio GUI

# Build and Lint
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint

# API Key Management
npm run create-api-key <email> <keyName>  # Create API key locally
```

## Architecture

### Configuration (lib/config.ts)
All environment variable access is centralized in `lib/config.ts` for:
- **Type safety**: Typed configuration objects with validation
- **Required validation**: Throws clear errors if required env vars are missing
- **Format validation**: Validates email and URL formats
- **Server/Client separation**: Separate configs for server-only and public variables

**Server-side config** (via `config` export):
- `config.database.url` - PostgreSQL connection string
- `config.auth.nextAuthUrl` - NextAuth callback URL
- `config.auth.nextAuthSecret` - JWT signing secret
- `config.auth.googleClientId` - Google OAuth client ID
- `config.auth.googleClientSecret` - Google OAuth client secret
- `config.auth.allowedUserEmail` - Single user email (validated)
- `config.app.url` - App URL for server operations
- `config.rateLimit.api` - API routes rate limit (requests & windowMs)
- `config.rateLimit.redirect` - Redirect routes rate limit
- `config.rateLimit.auth` - Auth routes rate limit
- `config.rateLimit.strict` - Strict rate limit for sensitive operations

**Client-side config** (via `getAppUrl()` helper):
- `getAppUrl()` - Returns app URL (works on both client and server, falls back to window.location.origin on client)

**Rate Limiting** (optional env vars with defaults):
All rate limits are configurable via environment variables. Each rate limiter has two settings:
- `RATE_LIMIT_*_REQUESTS` - Maximum number of requests allowed
- `RATE_LIMIT_*_WINDOW_MS` - Time window in milliseconds

Available rate limiters:
- **API** (default: 100 req/min) - `RATE_LIMIT_API_REQUESTS`, `RATE_LIMIT_API_WINDOW_MS`
- **REDIRECT** (default: 300 req/min) - `RATE_LIMIT_REDIRECT_REQUESTS`, `RATE_LIMIT_REDIRECT_WINDOW_MS`
- **AUTH** (default: 10 req/15min) - `RATE_LIMIT_AUTH_REQUESTS`, `RATE_LIMIT_AUTH_WINDOW_MS`
- **STRICT** (default: 5 req/min) - `RATE_LIMIT_STRICT_REQUESTS`, `RATE_LIMIT_STRICT_WINDOW_MS`

**Important**: Always use the config exports instead of directly accessing `process.env`:
```typescript
// ✅ Correct
import { config } from "@/lib/config";
const dbUrl = config.database.url;

// ❌ Wrong
const dbUrl = process.env.DATABASE_URL;
```

### Authentication Flow
- **Single-user system**: Only the email specified in `ALLOWED_USER_EMAIL` environment variable can sign in
- **Authentication check**: Enforced in `lib/auth.ts` via NextAuth `signIn` callback
- **Route protection**: Proxy (`proxy.ts`) protects all routes except:
  - `/auth/*` (auth pages)
  - `/api/auth/*` (auth API)
  - `/:shortCode` (public redirect endpoints)
  - Static files
- **Session strategy**: JWT-based with 30-day expiration
- **Post-login redirect**: Always redirects to `/dashboard` after successful authentication

### API Authentication (lib/api-auth.ts)
Two authentication methods are supported for API endpoints:

1. **Session Authentication** (Full Access)
   - Uses NextAuth session cookies
   - Provides read and write access to all API endpoints
   - Required for POST, PATCH, DELETE operations

2. **API Key Authentication** (Read-Only Access)
   - API keys are prefixed with `sk_` and 32 characters long
   - Passed via `Authorization` header: `Authorization: Bearer sk_xxx` or `Authorization: sk_xxx`
   - **Read-only access**: Only GET endpoints accept API keys
   - Write operations (POST/PATCH/DELETE) return 403 if attempted with API key
   - Last used timestamp is updated automatically (fire-and-forget)

API keys are managed via:
- `GET /api/api-keys` - List all API keys (session only, keys are hidden)
- `POST /api/api-keys` - Create new API key (session only, key shown only once)
- `DELETE /api/api-keys?id=[id]` - Delete API key (session only)

### Database Schema (lib/db/schema.ts)
- **users, accounts, sessions, verificationTokens**: NextAuth tables
- **links**: Core short link mappings with `shortCode` (unique, indexed), `originalUrl`, `clicks` counter, `isActive` flag, optional `expiresAt`
- **clicks**: Detailed analytics per click (timestamp, referer, user agent, device/browser/os parsing, IP, geo data)
- **tags**: User-created tags with name and color
- **linkTags**: Many-to-many junction table between links and tags
- **apiKeys**: API key storage (user-scoped, stores hashed key, name, and lastUsed timestamp)

All tables use UUID primary keys and proper foreign key cascades.

### URL Redirect Logic (app/[shortCode]/route.ts)
1. Lookup link by `shortCode`
2. Return styled 404 HTML if not found
3. Check `isActive` flag - return 410 HTML if disabled
4. Check `expiresAt` - return 410 HTML if expired
5. **Fire-and-forget analytics**: Insert click record and increment counter asynchronously (does not block redirect)
6. Perform 302 redirect to `originalUrl`

This pattern ensures fast redirects while still capturing detailed analytics.

### Component Structure
- **Dashboard.tsx**: Main authenticated view, orchestrates all dashboard components
- **CreateLinkForm.tsx**: Form for creating new short links with optional custom short code, title, and tag assignment
- **LinksTable.tsx**: Displays all links with inline actions (edit, delete, toggle active, view QR, copy URL)
- **EditLinkModal.tsx**: Modal for editing link properties and managing tags
- **Stats.tsx**: Displays aggregate statistics (total links, clicks, active links)
- **TagsSidebar.tsx**: Tag management and filtering interface

### API Routes
All API routes require authentication except redirect handler. Read-only endpoints support both session and API key auth:

**Links:**
- `GET /api/links` - List all user's links (supports API key)
- `POST /api/links` - Create link (session only, validates with `createLinkSchema`)
- `GET /api/links/[id]` - Get single link (supports API key)
- `PATCH /api/links/[id]` - Update link (session only, validates with `updateLinkSchema`)
- `DELETE /api/links/[id]` - Delete link (session only, cascades to clicks and linkTags)
- `GET /api/links/[id]/qr` - Generate QR code (supports API key)

**Analytics:**
- `GET /api/analytics/[linkId]` - Get detailed click analytics (supports API key)

**Tags:**
- `GET /api/tags` - List all tags (supports API key)
- `POST /api/tags` - Create tag (session only)
- `PATCH /api/tags/[id]` - Update tag (session only)
- `DELETE /api/tags/[id]` - Delete tag (session only, cascades to linkTags)

**API Keys:**
- `GET /api/api-keys` - List API keys (session only)
- `POST /api/api-keys` - Create API key (session only)
- `DELETE /api/api-keys?id=[id]` - Delete API key (session only)

### Validation (lib/validations.ts)
All schemas use Zod:
- `createLinkSchema`: Validates URL format, optional custom shortCode (3-20 chars, alphanumeric/hyphen/underscore only)
- `updateLinkSchema`: Partial updates for links
- `createTagSchema`/`updateTagSchema`: Tag name and hex color validation
- `createApiKeySchema`: For future API key creation

### Short Code Generation
If no custom short code provided, `nanoid()` generates a random 8-character code. Unique constraint on `links.shortCode` prevents collisions.

### User Agent Parsing (lib/utils.ts)
Uses `ua-parser-js` to extract device type, browser name, and OS from user agent strings for click analytics.

## Key Implementation Patterns

### Database Queries
- Use Drizzle ORM with typed queries
- Leverage indexes on `shortCode`, `userId`, `linkId`, and `timestamp` for performance
- All user-scoped queries filter by `userId` from session

### Error Handling
- API routes return JSON errors with appropriate HTTP status codes
- Redirect handler returns styled HTML error pages (404, 410, 500) instead of JSON

### Environment Variables
Required in `.env`:
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_URL` - Full app URL (with protocol)
- `NEXTAUTH_SECRET` - Random secret for JWT signing
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - OAuth credentials
- `NEXT_PUBLIC_APP_URL` - Public-facing URL for generating short links
- `ALLOWED_USER_EMAIL` - Single email address authorized to access the app

### Tags System
- Tags are user-scoped (each user has their own tags)
- Many-to-many relationship between links and tags via `linkTags` junction table
- Tag filtering in dashboard via query parameter: `/dashboard?tag=<tagId>`
- Tags can be assigned during link creation or via edit modal

## Testing

### Testing the Redirect Flow
1. Create a link in the dashboard (e.g., shortCode "test")
2. Visit `http://localhost:3000/test`
3. Should redirect to original URL and track click in database
4. Check analytics in dashboard to verify click was recorded with device/browser/OS data

### Testing API Key Authentication
1. Create an API key via dashboard or `POST /api/api-keys` with body: `{"name": "Test Key"}`
2. Copy the returned API key (starts with `sk_`, only shown once)
3. Test read access (should work):
   ```bash
   curl -H "Authorization: Bearer sk_xxx" http://localhost:3000/api/links
   curl -H "Authorization: sk_xxx" http://localhost:3000/api/tags
   ```
4. Test write access (should return 403):
   ```bash
   curl -X POST -H "Authorization: Bearer sk_xxx" \
     -H "Content-Type: application/json" \
     -d '{"url":"https://example.com"}' \
     http://localhost:3000/api/links
   # Expected: {"error":"API keys have read-only access..."}
   ```

## GitHub Workflows

### Create API Key Workflow

The repository includes a GitHub Actions workflow for creating API keys programmatically.

**Setup:**
1. Add `DATABASE_URL` secret in GitHub repository settings
2. Optionally configure environments (production, staging, development) with environment-specific DATABASE_URL secrets

**Usage:**
- Navigate to Actions → Create API Key → Run workflow
- Provide user email and key name
- Select environment
- API key will be shown in workflow logs (copy immediately)

**Local usage:**
```bash
export DATABASE_URL="your-postgres-connection-string"
npm run create-api-key your-email@example.com "My API Key"
```

See `.github/workflows/README.md` for detailed documentation and troubleshooting.
