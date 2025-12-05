import { db } from "@/lib/db";
import { links } from "@/lib/db/schema";
import { eq, sum, count, and } from "drizzle-orm";

export interface Stats {
  totalLinks: number;
  totalClicks: number;
  activeLinks: number;
}

export async function getUserStats(): Promise<Stats> {
  // Get total links and clicks
  const [stats] = await db
    .select({
      totalLinks: count(links.id),
      totalClicks: sum(links.clicks),
    })
    .from(links);

  // Get active links count
  const [activeStats] = await db
    .select({
      activeLinks: count(links.id),
    })
    .from(links);

  return {
    totalLinks: stats.totalLinks || 0,
    totalClicks: Number(stats.totalClicks) || 0,
    activeLinks: activeStats.activeLinks || 0,
  };
}
