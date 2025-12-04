# Link Shortener

A modern, feature-rich link shortener built with Next.js, React, Drizzle ORM, PostgreSQL, and TailwindCSS.

## Features

- 🔗 **URL Shortening** - Create short, memorable links
- 🎨 **Custom Aliases** - Choose your own short codes
- 📊 **Analytics Dashboard** - Track clicks, devices, browsers, and locations
- 🔒 **Google OAuth** - Secure single-user authentication
- 📱 **QR Code Generation** - Generate QR codes for your links
- 🔑 **API Keys** - Programmatic access to the link shortener
- 🎯 **Link Management** - View, edit, and delete your links
- ⚡ **BFF Pattern** - Backend for Frontend architecture

## Tech Stack

- **Frontend:** Next.js 16, React 19, TailwindCSS
- **Backend:** Next.js API Routes (BFF pattern)
- **Database:** PostgreSQL with Drizzle ORM
- **Authentication:** NextAuth.js with Google OAuth
- **Validation:** Zod
- **QR Codes:** qrcode library

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Google OAuth credentials

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` and fill in your values:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/linkshortener

# NextAuth - Generate secret with: openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-generated-secret-here

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
ALLOWED_USER_EMAIL=your-email@gmail.com
```

### 3. Set Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth Client ID"
5. Choose "Web application"
6. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
7. Copy the Client ID and Client Secret to your `.env` file

### 4. Set Up Database

Create your PostgreSQL database:

```bash
createdb linkshortener
```

Push the schema to the database:

```bash
npm run db:push
```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Commands

```bash
# Generate migrations
npm run db:generate

# Apply migrations
npm run db:migrate

# Push schema to database (useful for development)
npm run db:push

# Open Drizzle Studio (database GUI)
npm run db:studio
```

## Project Structure

```
link-shortener/
├── app/
│   ├── api/                    # API routes (BFF pattern)
│   │   ├── auth/              # Authentication endpoints
│   │   ├── links/             # Link management endpoints
│   │   ├── api-keys/          # API key management
│   │   └── analytics/         # Analytics endpoints
│   ├── auth/                  # Auth pages
│   ├── dashboard/             # Dashboard page
│   └── s/[shortCode]/         # Short URL redirect handler
├── components/                # React components
├── lib/
│   ├── db/                    # Database schema and connection
│   ├── auth.ts               # NextAuth configuration
│   ├── validations.ts        # Zod schemas
│   └── utils.ts              # Utility functions
└── types/                     # TypeScript type definitions
```

## API Routes

### Links

- `GET /api/links` - List all links
- `POST /api/links` - Create a new link
- `GET /api/links/[id]` - Get a specific link
- `PATCH /api/links/[id]` - Update a link
- `DELETE /api/links/[id]` - Delete a link
- `GET /api/links/[id]/qr` - Get QR code for a link

### Analytics

- `GET /api/analytics/[linkId]?days=30` - Get analytics for a link

### API Keys

- `GET /api/api-keys` - List all API keys
- `POST /api/api-keys` - Create a new API key
- `DELETE /api/api-keys?id=[id]` - Delete an API key

## Deployment

### Environment Variables for Production

Make sure to update these in your production environment:

- `DATABASE_URL` - Your production PostgreSQL connection string
- `NEXTAUTH_URL` - Your production domain (e.g., `https://yourdomain.com`)
- `NEXTAUTH_SECRET` - Generate a new secret for production
- `NEXT_PUBLIC_APP_URL` - Your production domain
- `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET` - Production OAuth credentials
- `ALLOWED_USER_EMAIL` - The email address allowed to access the app

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

1. Push your code to GitHub
2. Import the repository in Vercel
3. Add all environment variables
4. Deploy

## License

MIT
