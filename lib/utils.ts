import { nanoid } from "nanoid";
import { randomBytes } from "crypto";

export function generateShortCode(length: number = 6): string {
  return nanoid(length);
}

export function generateApiKey(): string {
  return `sk_${randomBytes(32).toString("hex")}`;
}

export function parseUserAgent(userAgent: string) {
  const device = /mobile/i.test(userAgent) ? "mobile" : "desktop";

  let browser = "unknown";
  if (userAgent.includes("Chrome")) browser = "Chrome";
  else if (userAgent.includes("Firefox")) browser = "Firefox";
  else if (userAgent.includes("Safari")) browser = "Safari";
  else if (userAgent.includes("Edge")) browser = "Edge";

  let os = "unknown";
  if (userAgent.includes("Windows")) os = "Windows";
  else if (userAgent.includes("Mac")) os = "macOS";
  else if (userAgent.includes("Linux")) os = "Linux";
  else if (userAgent.includes("Android")) os = "Android";
  else if (userAgent.includes("iOS")) os = "iOS";

  return { device, browser, os };
}

export function cn(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}
