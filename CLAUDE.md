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
```

## Architecture

### Authentication Flow
- **Single-user system**: Only the email specified in `ALLOWED_USER_EMAIL` environment variable can sign in
- **Authentication check**: Enforced in `lib/auth.ts` via NextAuth `signIn` callback
- **Route protection**: Middleware (`middleware.ts`) protects all routes except:
  - `/auth/*` (auth pages)
  - `/api/auth/*` (auth API)
  - `/:shortCode` (public redirect endpoints)
  - Static files
- **Session strategy**: JWT-based with 30-day expiration
- **Post-login redirect**: Always redirects to `/dashboard` after successful authentication

### Database Schema (lib/db/schema.ts)
- **users, accounts, sessions, verificationTokens**: NextAuth tables
- **links**: Core short link mappings with `shortCode` (unique, indexed), `originalUrl`, `clicks` counter, `isActive` flag, optional `expiresAt`
- **clicks**: Detailed analytics per click (timestamp, referer, user agent, device/browser/os parsing, IP, geo data)
- **tags**: User-created tags with name and color
- **linkTags**: Many-to-many junction table between links and tags
- **apiKeys**: Prepared for future API key authentication (not yet implemented)

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
All API routes require authentication (checked by middleware) except redirect handler:
- `POST /api/links` - Create link (validates with `createLinkSchema`)
- `GET /api/links` - List all user's links (with optional tag filtering)
- `GET /api/links/[id]` - Get single link
- `PATCH /api/links/[id]` - Update link (validates with `updateLinkSchema`)
- `DELETE /api/links/[id]` - Delete link (cascades to clicks and linkTags)
- `GET /api/links/[id]/qr` - Generate QR code as PNG
- `GET /api/analytics/[linkId]` - Get detailed click analytics
- `GET /api/tags` - List all tags
- `POST /api/tags` - Create tag
- `PATCH /api/tags/[id]` - Update tag
- `DELETE /api/tags/[id]` - Delete tag (cascades to linkTags)

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

## Testing the Redirect Flow

To test link redirects locally:
1. Create a link in the dashboard (e.g., shortCode "test")
2. Visit `http://localhost:3000/test`
3. Should redirect to original URL and track click in database
4. Check analytics in dashboard to verify click was recorded with device/browser/OS data
