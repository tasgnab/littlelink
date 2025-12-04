import { customAlphabet } from "nanoid";
import { db } from "@/lib/db";
import { links } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import UAParser from "ua-parser-js";

// Generate short code using nanoid
const nanoid = customAlphabet(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  6
);

export async function generateUniqueShortCode(): Promise<string> {
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    const shortCode = nanoid();
    const existing = await db
      .select()
      .from(links)
      .where(eq(links.shortCode, shortCode))
      .limit(1);

    if (existing.length === 0) {
      return shortCode;
    }

    attempts++;
  }

  throw new Error("Failed to generate unique short code");
}

export function parseUserAgent(userAgent: string) {
  const parser = new UAParser(userAgent);
  const result = parser.getResult();

  return {
    device: result.device.type || "desktop",
    browser: result.browser.name || "unknown",
    os: result.os.name || "unknown",
  };
}

export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}
