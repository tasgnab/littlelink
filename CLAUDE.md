# LittleLink - Development Guide

Self-hosted URL shortener with analytics, built on Next.js 16, PostgreSQL, and Drizzle ORM.

## Quick Start

```bash
# Development
npm run dev              # Start dev server (Turbopack)

# Database
npm run db:push          # Push schema changes (dev)
npm run db:studio        # Open Drizzle Studio GUI

# API Keys
npm run create-api-key <email> <keyName>
```

## Core Features

- **Authentication**: Single-user Google OAuth (email-restricted)
- **Link Management**: Custom short codes, tags, QR codes, expiration
- **Analytics**: Click tracking with device/browser/OS/geo data, 404 tracking
- **API**: Read-only API keys, full REST API
- **Public Page**: Linktree-style landing page at root URL

## Architecture

### Configuration (`lib/config.ts`)
Centralized env var access with TypeScript validation. Always use config exports, never `process.env` directly.

```typescript
import { config } from "@/lib/config";
const dbUrl = config.database.url; // ✅ Correct
```

**Key configs:**
- Database: `config.database.url`
- Auth: `config.auth.*` (NextAuth settings, allowed email)
- Rate limits: `config.rateLimit.*` (api, redirect, auth, strict)
- Geolocation: `config.geolocation.*` (provider, Abstract API key)

### Authentication

**Single-user system**: Only `ALLOWED_USER_EMAIL` can sign in via Google OAuth.

**Protected routes** (`proxy.ts`):
- Protected: `/dashboard`, `/api/*` (except auth)
- Public: `/`, `/:shortCode`, `/auth/*`, `/api/auth/*`

**API Authentication** (`lib/api-auth.ts`):
1. **Session** (full access): NextAuth cookies
2. **API Keys** (read-only): `Authorization: Bearer sk_xxx`
   - GET requests only
   - POST/PATCH/DELETE return 403

### Database Schema

**Tables:**
- `users`, `accounts`, `sessions`, `verificationTokens` - NextAuth
- `links` - Short code mappings, clicks counter, active flag, expiration
- `clicks` - Analytics (timestamp, UA, IP, geo, device/browser/OS)
- `orphanedVisits` - 404 tracking for non-existent short codes
- `tags` - User tags with colors
- `linkTags` - Many-to-many link↔tag junction
- `apiKeys` - Hashed API keys with last used timestamp

All tables use UUID primary keys with proper cascades.

### Redirect Flow (`app/[shortCode]/route.ts`)

1. Lookup `shortCode`
2. If not found → 404 HTML + track orphaned visit (async)
3. Check `isActive` → 410 if disabled
4. Check `expiresAt` → 410 if expired
5. Track click + increment counter (async, fire-and-forget)
6. 302 redirect to `originalUrl`

Fast redirects while capturing full analytics.

### Geolocation (Abstract API)

**Provider Registry System**: Extensible architecture supporting multiple geolocation providers.

**Current Provider**: Abstract API IP Intelligence
- API-based geolocation lookups
- Returns country and city data
- 5-second timeout for reliability
- Graceful error handling (returns null on failure)

**Provider Structure:**
```
lib/services/geolocation/
├── types.ts              # GeoLocation and GeoLocationProvider interfaces
├── registry.ts           # Provider registration system
├── providers/
│   └── abstract-api.ts   # Abstract API implementation
└── geolocation.ts        # Main service (uses configured provider)
```

**Configuration:**
- Set `GEOLOCATION_PROVIDER=abstract-api` (default)
- Set `ABSTRACT_API_KEY` to your API key from https://www.abstractapi.com/api/ip-geolocation-api
- Free tier available with registration

**Adding New Providers:**
1. Create file in `lib/services/geolocation/providers/`
2. Implement `GeoLocationProvider` interface
3. Register in `geolocation.ts`
4. Add configuration to `lib/config.ts`

## API Routes

All routes require authentication except public redirects. Read-only endpoints support API keys.

**Links:**
- `GET /api/links` - List links *(API key supported)*
- `POST /api/links` - Create link
- `GET /api/links/[id]` - Get link *(API key supported)*
- `PATCH /api/links/[id]` - Update link
- `DELETE /api/links/[id]` - Delete link
- `GET /api/links/[id]/qr` - Generate QR code *(API key supported)*

**Analytics:**
- `GET /api/analytics/[linkId]` - Link analytics *(API key supported)*
- `GET /api/analytics/global` - Global analytics *(API key supported)*
- `GET /api/analytics/tags/[id]` - Tag analytics *(API key supported)*

**Tags:**
- `GET /api/tags` - List tags *(API key supported)*
- `POST /api/tags` - Create tag
- `PATCH /api/tags/[id]` - Update tag
- `DELETE /api/tags/[id]` - Delete tag

**API Keys:**
- `GET /api/api-keys` - List keys
- `POST /api/api-keys` - Create key
- `DELETE /api/api-keys?id=[id]` - Delete key

## Environment Variables

**Required:**
```env
DATABASE_URL=postgresql://...
NEXTAUTH_URL=https://your-app.com
NEXTAUTH_SECRET=random-secret
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
NEXT_PUBLIC_APP_URL=https://your-app.com
ALLOWED_USER_EMAIL=your@email.com
```

**Optional:**
```env
# Geolocation Provider
GEOLOCATION_PROVIDER=abstract-api    # Provider name (default: abstract-api)
ABSTRACT_API_KEY=...                 # Get free at abstractapi.com/api/ip-geolocation-api

# Rate Limiting (all have sensible defaults)
RATE_LIMIT_API_REQUESTS=100
RATE_LIMIT_API_WINDOW_MS=60000
RATE_LIMIT_REDIRECT_REQUESTS=300
RATE_LIMIT_REDIRECT_WINDOW_MS=60000
RATE_LIMIT_AUTH_REQUESTS=10
RATE_LIMIT_AUTH_WINDOW_MS=900000
RATE_LIMIT_STRICT_REQUESTS=5
RATE_LIMIT_STRICT_WINDOW_MS=60000
```

**Production Note:** Next.js doesn't load `.env` in production. Use `npm run start:prod` or set vars in deployment platform.

## Key Components

- `Dashboard.tsx` - Main authenticated view
- `CreateLinkForm.tsx` - New link form
- `LinksTable.tsx` - Link list with actions
- `EditLinkModal.tsx` - Edit link modal
- `TagsSidebar.tsx` - Tag management
- `GlobalAnalyticsModal.tsx` - Analytics modal with 404 tracking

## Testing

**Redirect:**
```bash
# Create link with shortCode "test", then:
curl http://localhost:3000/test  # Should redirect
```

**API Key:**
```bash
# Create key in dashboard, then:
curl -H "Authorization: Bearer sk_xxx" http://localhost:3000/api/links  # ✅ Works
curl -X POST -H "Authorization: Bearer sk_xxx" http://localhost:3000/api/links  # ❌ 403
```

## Deployment (Vercel)

1. Set all required environment variables in Vercel dashboard
2. For geolocation:
   - Get API key from https://www.abstractapi.com/api/ip-geolocation-api
   - Set `ABSTRACT_API_KEY` in Vercel dashboard
   - Optional: Set `GEOLOCATION_PROVIDER=abstract-api` (this is the default)
3. Deploy

## GitHub Actions

**Create API Key Workflow:**
- Navigate to Actions → Create API Key → Run workflow
- Requires `DATABASE_URL` secret
- Supports multiple environments

See `.github/workflows/README.md` for details.

## Validation & Security

- **Zod schemas** validate all inputs (`lib/validations.ts`)
- **Rate limiting** on all endpoints (configurable)
- **API keys** are hashed, read-only by default
- **Cron endpoints** protected by `CRON_SECRET`
- **User agents** parsed with `ua-parser-js`
- **Short codes** generated with `nanoid()` (8 chars, collision-safe)

## Performance Optimizations

- **Async analytics**: Fire-and-forget tracking doesn't block redirects
- **Indexed queries**: `shortCode`, `userId`, `linkId`, `timestamp`
- **Geolocation**: API-based lookups with 5s timeout, failures return gracefully without blocking
