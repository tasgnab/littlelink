import { db } from "@/lib/db";
import { clicks, links } from "@/lib/db/schema";
import { eq, and, gte } from "drizzle-orm";

export interface Click {
  id: string;
  linkId: string;
  timestamp: Date;
  referer: string | null;
  userAgent: string | null;
  device: string | null;
  browser: string | null;
  os: string | null;
  ipAddress: string | null;
  country: string | null;
  city: string | null;
}

export interface Analytics {
  totalClicks: number;
  deviceStats: Record<string, number>;
  browserStats: Record<string, number>;
  osStats: Record<string, number>;
  recentClicks: Click[];
}

export async function getLinkAnalytics(
  linkId: string,
  userId: string,
  days: number = 30
): Promise<Analytics | null> {
  // Verify link belongs to user
  const [link] = await db
    .select()
    .from(links)
    .where(and(eq(links.id, linkId), eq(links.userId, userId)))
    .limit(1);

  if (!link) {
    return null;
  }

  // Calculate date threshold
  const dateThreshold = new Date();
  dateThreshold.setDate(dateThreshold.getDate() - days);

  // Get clicks data
  const clicksData = await db
    .select()
    .from(clicks)
    .where(
      and(eq(clicks.linkId, linkId), gte(clicks.timestamp, dateThreshold))
    )
    .orderBy(clicks.timestamp);

  // Aggregate statistics
  const deviceStats = clicksData.reduce((acc: Record<string, number>, click) => {
    const device = click.device || "unknown";
    acc[device] = (acc[device] || 0) + 1;
    return acc;
  }, {});

  const browserStats = clicksData.reduce((acc: Record<string, number>, click) => {
    const browser = click.browser || "unknown";
    acc[browser] = (acc[browser] || 0) + 1;
    return acc;
  }, {});

  const osStats = clicksData.reduce((acc: Record<string, number>, click) => {
    const os = click.os || "unknown";
    acc[os] = (acc[os] || 0) + 1;
    return acc;
  }, {});

  return {
    totalClicks: clicksData.length,
    deviceStats,
    browserStats,
    osStats,
    recentClicks: clicksData.slice(-50), // Last 50 clicks
  };
}
