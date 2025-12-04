function getEnvVar(key: string, required: boolean = true): string {
  const value = process.env[key];

  if (required && !value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value || "";
}

export const config = {
  database: {
    url: getEnvVar("DATABASE_URL"),
  },
  auth: {
    url: getEnvVar("NEXTAUTH_URL"),
    secret: getEnvVar("NEXTAUTH_SECRET"),
    allowedUserEmail: getEnvVar("ALLOWED_USER_EMAIL"),
    google: {
      clientId: getEnvVar("GOOGLE_CLIENT_ID"),
      clientSecret: getEnvVar("GOOGLE_CLIENT_SECRET"),
    },
  },
  app: {
    url: getEnvVar("NEXT_PUBLIC_APP_URL"),
  },
} as const;
