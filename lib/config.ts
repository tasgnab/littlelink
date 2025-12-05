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
    url: getRequiredEnv(
      "DATABASE_URL",
      "DATABASE_URL is required. Please set it in your .env file."
    ),
  },

  auth: {
    // NextAuth configuration
    nextAuthUrl: getRequiredEnv(
      "NEXTAUTH_URL",
      "NEXTAUTH_URL is required for authentication. Set it to your app's URL (e.g., http://localhost:3000)"
    ),
    nextAuthSecret: getRequiredEnv(
      "NEXTAUTH_SECRET",
      "NEXTAUTH_SECRET is required. Generate one with: openssl rand -base64 32"
    ),

    // Google OAuth
    googleClientId: getRequiredEnv(
      "GOOGLE_CLIENT_ID",
      "GOOGLE_CLIENT_ID is required for Google OAuth. Get it from Google Cloud Console."
    ),
    googleClientSecret: getRequiredEnv(
      "GOOGLE_CLIENT_SECRET",
      "GOOGLE_CLIENT_SECRET is required for Google OAuth. Get it from Google Cloud Console."
    ),

    // Allowed user email
    allowedUserEmail: (() => {
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
    })(),
  },

  app: {
    // App URL for server-side operations (like generating QR codes)
    url: (() => {
      const url = getOptionalEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
      if (!validateUrl(url)) {
        throw new Error(
          `NEXT_PUBLIC_APP_URL must be a valid URL. Got: ${url}`
        );
      }
      return url;
    })(),
  },

  // Flag for checking if running in GitHub Actions
  isGitHubActions: process.env.GITHUB_ACTIONS === "true",
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
 */
export const config = {
  database: {
    url: serverConfig.database.url,
  },
  auth: {
    nextAuthUrl: serverConfig.auth.nextAuthUrl,
    nextAuthSecret: serverConfig.auth.nextAuthSecret,
    googleClientId: serverConfig.auth.googleClientId,
    googleClientSecret: serverConfig.auth.googleClientSecret,
    allowedUserEmail: serverConfig.auth.allowedUserEmail,
  },
  app: {
    url: serverConfig.app.url,
  },
  isGitHubActions: serverConfig.isGitHubActions,
} as const;

// Export types for TypeScript
export type Config = typeof config;
export type ServerConfig = typeof serverConfig;
export type ClientConfig = typeof clientConfig;
