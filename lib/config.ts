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

/**
 * Server-side configuration
 * These variables are only accessible on the server
 */
export const serverConfig = {
  database: {
    // Lazy getter to avoid validation during build time
    get url() {
      return getRequiredEnv(
        "DATABASE_URL",
        "DATABASE_URL is required. Please set it in your .env file."
      );
    },
  },

  auth: {
    // NextAuth configuration - lazy getters to avoid validation during build time
    get nextAuthUrl() {
      return getRequiredEnv(
        "NEXTAUTH_URL",
        "NEXTAUTH_URL is required for authentication. Set it to your app's URL (e.g., http://localhost:3000)"
      );
    },
    get nextAuthSecret() {
      return getRequiredEnv(
        "NEXTAUTH_SECRET",
        "NEXTAUTH_SECRET is required. Generate one with: openssl rand -base64 32"
      );
    },

    // Google OAuth
    get googleClientId() {
      return getRequiredEnv(
        "GOOGLE_CLIENT_ID",
        "GOOGLE_CLIENT_ID is required for Google OAuth. Get it from Google Cloud Console."
      );
    },
    get googleClientSecret() {
      return getRequiredEnv(
        "GOOGLE_CLIENT_SECRET",
        "GOOGLE_CLIENT_SECRET is required for Google OAuth. Get it from Google Cloud Console."
      );
    },

    // Allowed user email
    get allowedUserEmail() {
      const email = getRequiredEnv(
        "ALLOWED_USER_EMAIL",
        "ALLOWED_USER_EMAIL is required. Set it to the email address that should have access."
      );
      if (!validateEmail(email)) {
        throw new Error(
          `ALLOWED_USER_EMAIL must be a valid email address. Got: ${email}`
        );
      }
      return email;
    },
  },

  app: {
    // App URL for server-side operations (like generating QR codes)
    get url() {
      const url = getOptionalEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
      if (!validateUrl(url)) {
        throw new Error(
          `NEXT_PUBLIC_APP_URL must be a valid URL. Got: ${url}`
        );
      }
      return url;
    },
  },

  // Flag for checking if running in GitHub Actions
  isGitHubActions: process.env.GITHUB_ACTIONS === "true",

  // Rate limiting configuration
  rateLimit: {
    // API routes rate limit (requests per minute)
    api: {
      requests: parseInt(getOptionalEnv("RATE_LIMIT_API_REQUESTS", "100")),
      windowMs: parseInt(getOptionalEnv("RATE_LIMIT_API_WINDOW_MS", "60000")), // 1 minute
    },
    // Redirect routes rate limit (requests per minute) - higher for primary function
    redirect: {
      requests: parseInt(getOptionalEnv("RATE_LIMIT_REDIRECT_REQUESTS", "300")),
      windowMs: parseInt(getOptionalEnv("RATE_LIMIT_REDIRECT_WINDOW_MS", "60000")), // 1 minute
    },
    // Auth routes rate limit (requests per 15 minutes) - prevent brute force
    auth: {
      requests: parseInt(getOptionalEnv("RATE_LIMIT_AUTH_REQUESTS", "10")),
      windowMs: parseInt(getOptionalEnv("RATE_LIMIT_AUTH_WINDOW_MS", "900000")), // 15 minutes
    },
    // Strict rate limit for sensitive operations (requests per minute)
    strict: {
      requests: parseInt(getOptionalEnv("RATE_LIMIT_STRICT_REQUESTS", "5")),
      windowMs: parseInt(getOptionalEnv("RATE_LIMIT_STRICT_WINDOW_MS", "60000")), // 1 minute
    },
  },
} as const;

/**
 * Client-side configuration
 * These variables are accessible in the browser (must be prefixed with NEXT_PUBLIC_)
 */
export const clientConfig = {
  app: {
    url: getOptionalEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000"),
  },
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
 * Type-safe config object that exports only what's needed
 * Uses getters to maintain lazy evaluation
 */
export const config = {
  database: {
    get url() {
      return serverConfig.database.url;
    },
  },
  auth: {
    get nextAuthUrl() {
      return serverConfig.auth.nextAuthUrl;
    },
    get nextAuthSecret() {
      return serverConfig.auth.nextAuthSecret;
    },
    get googleClientId() {
      return serverConfig.auth.googleClientId;
    },
    get googleClientSecret() {
      return serverConfig.auth.googleClientSecret;
    },
    get allowedUserEmail() {
      return serverConfig.auth.allowedUserEmail;
    },
  },
  app: {
    get url() {
      return serverConfig.app.url;
    },
  },
  rateLimit: serverConfig.rateLimit,
  isGitHubActions: serverConfig.isGitHubActions,
};

// Export types for TypeScript
export type Config = typeof config;
export type ServerConfig = typeof serverConfig;
export type ClientConfig = typeof clientConfig;
