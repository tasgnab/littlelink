/**
 * Centralized configuration for environment variables
 * All environment variable access should go through this file
 */

// Helper to validate required environment variables
function getRequiredEnv(key: string, errorMessage?: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      errorMessage || `Missing required environment variable: ${key}`
    );
  }
  return value;
}

// Helper to get optional environment variables with defaults
function getOptionalEnv(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

// Helper to validate email format
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Helper to validate URL format
function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Validate allowed user email
const allowedEmail = getRequiredEnv(
  "ALLOWED_USER_EMAIL",
  "ALLOWED_USER_EMAIL is required. Set it to the email address that should have access."
);
if (!validateEmail(allowedEmail)) {
  throw new Error(
    `ALLOWED_USER_EMAIL must be a valid email address. Got: ${allowedEmail}`
  );
}

// Validate app URL
const appUrl = getOptionalEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
if (!validateUrl(appUrl)) {
  throw new Error(`NEXT_PUBLIC_APP_URL must be a valid URL. Got: ${appUrl}`);
}

/**
 * Server-side configuration
 * These variables are only accessible on the server
 */
export const serverConfig = {
  database: {
    url: getRequiredEnv(
      "DATABASE_URL",
      "DATABASE_URL is required. Please set it in your .env file."
    ),
  },

  auth: {
    nextAuthUrl: getRequiredEnv(
      "NEXTAUTH_URL",
      "NEXTAUTH_URL is required for authentication. Set it to your app's URL (e.g., http://localhost:3000)"
    ),
    nextAuthSecret: getRequiredEnv(
      "NEXTAUTH_SECRET",
      "NEXTAUTH_SECRET is required. Generate one with: openssl rand -base64 32"
    ),
    googleClientId: getRequiredEnv(
      "GOOGLE_CLIENT_ID",
      "GOOGLE_CLIENT_ID is required for Google OAuth. Get it from Google Cloud Console."
    ),
    googleClientSecret: getRequiredEnv(
      "GOOGLE_CLIENT_SECRET",
      "GOOGLE_CLIENT_SECRET is required for Google OAuth. Get it from Google Cloud Console."
    ),
    allowedUserEmail: allowedEmail,
  },

  app: {
    url: appUrl,
  },

  isGitHubActions: process.env.GITHUB_ACTIONS === "true",

  maxmind: {
    licenseKey: process.env.MAXMIND_LICENSE_KEY || null,
    databasePath: getOptionalEnv("MAXMIND_DATABASE_PATH", "./data/GeoLite2-City.mmdb"),
    blobToken: process.env.BLOB_READ_WRITE_TOKEN || null,
    storageMode: getOptionalEnv("MAXMIND_STORAGE_MODE", "local") as "local" | "blob",
  },

  rateLimit: {
    api: {
      requests: parseInt(getOptionalEnv("RATE_LIMIT_API_REQUESTS", "100")),
      windowMs: parseInt(getOptionalEnv("RATE_LIMIT_API_WINDOW_MS", "60000")),
    },
    redirect: {
      requests: parseInt(getOptionalEnv("RATE_LIMIT_REDIRECT_REQUESTS", "300")),
      windowMs: parseInt(getOptionalEnv("RATE_LIMIT_REDIRECT_WINDOW_MS", "60000")),
    },
    auth: {
      requests: parseInt(getOptionalEnv("RATE_LIMIT_AUTH_REQUESTS", "10")),
      windowMs: parseInt(getOptionalEnv("RATE_LIMIT_AUTH_WINDOW_MS", "900000")),
    },
    strict: {
      requests: parseInt(getOptionalEnv("RATE_LIMIT_STRICT_REQUESTS", "5")),
      windowMs: parseInt(getOptionalEnv("RATE_LIMIT_STRICT_WINDOW_MS", "60000")),
    },
  },
} as const;

/**
 * Client-side configuration
 * These variables are accessible in the browser (must be prefixed with NEXT_PUBLIC_)
 */
export const clientConfig = {
  app: {
    url: process.env.NEXT_PUBLIC_APP_URL || "",
  },
  gravatar: process.env.NEXT_PUBLIC_GRAVATAR || null,
  title: process.env.NEXT_PUBLIC_TITLE || "LittleLink",
  tagline: process.env.NEXT_PUBLIC_TITLE_TAGLINE || "Your personal link hub",
} as const;

/**
 * Get the app URL (works on both client and server)
 * Falls back to window.location.origin on the client if not set
 */
export function getAppUrl(): string {
  // Server-side
  if (typeof window === "undefined") {
    return serverConfig.app.url;
  }

  // Client-side - prefer env var, fall back to window.location
  return clientConfig.app.url || window.location.origin;
}

/**
 * Main config export - alias for serverConfig
 * All validation happens at module load time
 */
export const config = serverConfig;

// Export types for TypeScript
export type Config = typeof serverConfig;
export type ServerConfig = typeof serverConfig;
export type ClientConfig = typeof clientConfig;
