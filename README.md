# LittleLink - URL Shortener

A modern, self-hosted link shortener built with Next.js, featuring Google OAuth authentication, PostgreSQL database, and comprehensive analytics.

## Features

- 🔗 **URL Shortening**: Create short links with custom or auto-generated codes
- 🔐 **Single-User Auth**: Google OAuth with email restriction (single authorized user)
- 📊 **Analytics**: Track clicks, devices, browsers, operating systems, and geographic location
- 🌍 **Geolocation**: IP-based location tracking with multiple providers and automatic fallback
- 🎨 **Modern UI**: Clean, responsive interface built with Tailwind CSS
- 📱 **QR Codes**: Generate QR codes for any short link
- 🔄 **Link Management**: Toggle active/inactive status, set expiration dates
- ⚡ **Fast Redirects**: Optimized redirect handling with async click tracking
- 🗄️ **PostgreSQL**: Reliable database with Drizzle ORM

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI**: React 19, Tailwind CSS
- **Database**: PostgreSQL (Neon)
- **ORM**: Drizzle ORM
- **Authentication**: NextAuth.js with Google OAuth
- **Validation**: Zod
- **Deployment**: Vercel-ready

## Quick Start

### 1. Prerequisites

- Node.js 18+ installed
- PostgreSQL database (e.g., Neon, Supabase, or local)
- Google OAuth credentials

### 2. Clone and Install

```bash
git clone <your-repo-url>
cd littlelink
npm install
```

### 3. Environment Setup

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required environment variables:

- `DATABASE_URL`: Your PostgreSQL connection string
- `NEXTAUTH_URL`: Your app URL (http://localhost:3000 for local dev)
- `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
- `GOOGLE_CLIENT_ID`: From Google Cloud Console
- `GOOGLE_CLIENT_SECRET`: From Google Cloud Console
- `NEXT_PUBLIC_APP_URL`: Public-facing app URL
- `ALLOWED_USER_EMAIL`: Email address allowed to sign in

Optional (for geolocation analytics):

- `GEOLOCATION_PROVIDER`: Comma-separated provider list (e.g., `abstract-api,ipgeolocation`)
- `ABSTRACT_API_KEY`: From [Abstract API](https://www.abstractapi.com/api/ip-geolocation-api)
- `IPGEOLOCATION_API_KEY`: From [IPGeolocation](https://ipgeolocation.io)

### 4. Set Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Copy Client ID and Client Secret to `.env`

### 5. Database Setup

Push the schema to your database:

```bash
npm run db:push
```

For production, use migrations:

```bash
npm run db:generate
npm run db:migrate
```

### 6. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Usage

### Creating Short Links

1. Sign in with your authorized Google account
2. Enter the original URL
3. (Optional) Set a custom short code
4. (Optional) Add a title
5. Click "Create Short Link"

Your short link will be: `http://localhost:3000/abc123`

### Managing Links

- **Toggle Active/Inactive**: Temporarily disable links without deleting them
- **View Analytics**: See click counts and statistics
- **Generate QR Codes**: Create scannable QR codes for any link
- **Delete Links**: Permanently remove links (this also deletes all click data)

### API Endpoints

All API endpoints require authentication except for the redirect handler:

- `GET /[shortCode]` - Redirect to original URL (public)
- `GET /api/links` - List all links
- `POST /api/links` - Create new link
- `GET /api/links/[id]` - Get single link
- `PATCH /api/links/[id]` - Update link
- `DELETE /api/links/[id]` - Delete link
- `GET /api/links/[id]/qr` - Generate QR code
- `GET /api/analytics/[linkId]` - Get analytics

## Database Schema

### Tables

- **users**: User accounts (NextAuth)
- **accounts**: OAuth accounts (NextAuth)
- **sessions**: User sessions (NextAuth)
- **links**: Short link mappings
- **clicks**: Click tracking and analytics
- **apiKeys**: API key management (future feature)

## Development Commands

```bash
npm run dev          # Start development server with Turbopack
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint

npm run db:push      # Push schema changes to database
npm run db:generate  # Generate migrations
npm run db:migrate   # Apply migrations
npm run db:studio    # Open Drizzle Studio GUI
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Environment Variables for Production

Update these for production:

```env
NEXTAUTH_URL=https://your-domain.com
NEXT_PUBLIC_APP_URL=https://your-domain.com
ALLOWED_USER_EMAIL=your-production-email@example.com
```

## Geolocation

Geographic analytics are powered by external geolocation APIs with automatic fallback:

- **Supports multiple providers**: Abstract API, IPGeolocation, and more
- **Automatic fallback**: If primary provider fails, tries next in chain
- **Optional**: Works without geolocation (returns null for location data)
- **Privacy-friendly**: Private/localhost IPs detected locally, not sent to providers

Configure with `GEOLOCATION_PROVIDER` environment variable. See [CLAUDE.md](./CLAUDE.md) for details.

## Security Notes

- Only the email specified in `ALLOWED_USER_EMAIL` can sign in
- All routes except `/[shortCode]` and `/auth/*` require authentication
- API keys table is prepared for future programmatic access
- Click tracking uses fire-and-forget pattern to avoid slowing redirects

## License

MIT

## Credits

Built with ❤️ using Next.js, React, and Drizzle ORM
