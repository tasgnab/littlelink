import { db } from "@/lib/db";
import { clicks, links, linkTags, tags, orphanedVisits } from "@/lib/db/schema";
import { eq, and, gte, sql, desc, count as drizzleCount, inArray } from "drizzle-orm";
import { NextRequest } from "next/server";
import { Link } from "./links";
import { parseUserAgent } from "../utils";
import { lookupIP } from "@/lib/services/geolocation";

export interface Click {
  id: string;
  linkId: string;
  timestamp: Date;
  referer: string | null;
  userAgent: string | null;
  device: string | null;
  browser: string | null;
  os: string | null;
  ip: string | null;
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

export interface NewClickParams {
  id: string;
  linkId: string;
  timestamp: Date;
  referer: string | null;
  userAgent: string | null;
  device: string | null;
  browser: string | null;
  os: string | null;
  ip: string | null;
  country: string | null;
  city: string | null;
}

export async function trackVisit(request: NextRequest, link: Link) {
  const userAgent = request.headers.get("user-agent") || "";
  const referer = request.headers.get("referer") || null;
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || null;

  const { device, browser, os } = parseUserAgent(userAgent);

  const { country, city } = await lookupIP(ip);

  // Don't await this - fire and forget
  db.insert(clicks)
    .values({
      linkId: link.id,
      referer,
      userAgent,
      ip,
      device,
      browser,
      os,
      country,
      city,
    })
    .then(() => {
      // Also increment the click counter on the link
      return db
        .update(links)
        .set({ clicks: link.clicks + 1 })
        .where(eq(links.id, link.id));
    })
    .catch((error) => {
      console.error("Error tracking click:", error);
    });
}

export async function trackOrphanedVisit(request: NextRequest, shortCode: string) {
  const userAgent = request.headers.get("user-agent") || "";
  const referer = request.headers.get("referer") || null;
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || null;

  const { device, browser, os } = parseUserAgent(userAgent);

  // Dynamically import geolocation service
  const { country, city } = await lookupIP(ip);

  // Don't await this - fire and forget
  db.insert(orphanedVisits)
    .values({
      shortCode,
      referer,
      userAgent,
      ip,
      device,
      browser,
      os,
      country,
      city,
    })
    .catch((error) => {
      console.error("Error tracking orphaned visit:", error);
    });
}

// Tag Analytics
export interface TagAnalytics {
  tagId: string;
  tagName: string;
  tagColor: string;
  totalClicks: number;
  linksCount: number;
  clickTrend: { date: string; clicks: number }[];
}

export interface IndividualTagAnalytics {
  tagId: string;
  tagName: string;
  tagColor: string;
  totalClicks: number;
  linksCount: number;
  clickTrend: { date: string; clicks: number }[];
  topLinks: { linkId: string; shortCode: string; title: string | null; clicks: number }[];
  deviceStats: { device: string; clicks: number; percentage: number }[];
  browserStats: { browser: string; clicks: number; percentage: number }[];
  osStats: { os: string; clicks: number; percentage: number }[];
  topCountries: { country: string; clicks: number }[];
  recentClicks: {
    id: string;
    timestamp: Date;
    device: string | null;
    browser: string | null;
    os: string | null;
    country: string | null;
    city: string | null;
    shortCode: string;
  }[];
}

export async function getTagAnalytics(
  userId: string,
  days: number = 30
): Promise<TagAnalytics[]> {
  // Calculate date threshold
  const dateThreshold = new Date();
  dateThreshold.setDate(dateThreshold.getDate() - days);

  // Get all tags with their link counts and click counts
  const tagStats = await db
    .select({
      tagId: tags.id,
      tagName: tags.name,
      tagColor: tags.color,
      linkId: linkTags.linkId,
    })
    .from(tags)
    .leftJoin(linkTags, eq(tags.id, linkTags.tagId))
    .where(eq(tags.userId, userId));

  // Group by tag and get unique link IDs
  const tagMap = new Map<string, {
    tagId: string;
    tagName: string;
    tagColor: string;
    linkIds: Set<string>;
  }>();

  for (const row of tagStats) {
    if (!tagMap.has(row.tagId)) {
      tagMap.set(row.tagId, {
        tagId: row.tagId,
        tagName: row.tagName,
        tagColor: row.tagColor,
        linkIds: new Set(),
      });
    }
    if (row.linkId) {
      tagMap.get(row.tagId)!.linkIds.add(row.linkId);
    }
  }

  // For each tag, get click data
  const result: TagAnalytics[] = [];

  for (const [tagId, tagData] of tagMap) {
    if (tagData.linkIds.size === 0) {
      result.push({
        tagId: tagData.tagId,
        tagName: tagData.tagName,
        tagColor: tagData.tagColor,
        totalClicks: 0,
        linksCount: 0,
        clickTrend: [],
      });
      continue;
    }

    // Get all clicks for links with this tag
    const linkIdsArray = Array.from(tagData.linkIds);
    const tagClicks = await db
      .select({
        timestamp: clicks.timestamp,
      })
      .from(clicks)
      .where(
        and(
          inArray(clicks.linkId, linkIdsArray),
          gte(clicks.timestamp, dateThreshold)
        )
      );

    // Group clicks by date for trend
    const clicksByDate = new Map<string, number>();
    for (const click of tagClicks) {
      const dateStr = click.timestamp.toISOString().split('T')[0];
      clicksByDate.set(dateStr, (clicksByDate.get(dateStr) || 0) + 1);
    }

    const clickTrend = Array.from(clicksByDate.entries())
      .map(([date, clicks]) => ({ date, clicks }))
      .sort((a, b) => a.date.localeCompare(b.date));

    result.push({
      tagId: tagData.tagId,
      tagName: tagData.tagName,
      tagColor: tagData.tagColor,
      totalClicks: tagClicks.length,
      linksCount: tagData.linkIds.size,
      clickTrend,
    });
  }

  // Sort by total clicks descending
  return result.sort((a, b) => b.totalClicks - a.totalClicks);
}

export async function getIndividualTagAnalytics(
  tagId: string,
  userId: string,
  days: number = 30
): Promise<IndividualTagAnalytics | null> {
  // Calculate date threshold
  const dateThreshold = new Date();
  dateThreshold.setDate(dateThreshold.getDate() - days);

  // Get tag info and verify ownership
  const [tag] = await db
    .select()
    .from(tags)
    .where(and(eq(tags.id, tagId), eq(tags.userId, userId)))
    .limit(1);

  if (!tag) {
    return null;
  }

  // Get all links with this tag
  const tagLinks = await db
    .select({
      linkId: linkTags.linkId,
      shortCode: links.shortCode,
      title: links.title,
      clicks: links.clicks,
    })
    .from(linkTags)
    .innerJoin(links, eq(linkTags.linkId, links.id))
    .where(eq(linkTags.tagId, tagId));

  const linkIds = tagLinks.map(l => l.linkId);

  if (linkIds.length === 0) {
    return {
      tagId: tag.id,
      tagName: tag.name,
      tagColor: tag.color,
      totalClicks: 0,
      linksCount: 0,
      clickTrend: [],
      topLinks: [],
      deviceStats: [],
      browserStats: [],
      osStats: [],
      topCountries: [],
      recentClicks: [],
    };
  }

  // Get all clicks for links with this tag
  const tagClicks = await db
    .select({
      id: clicks.id,
      timestamp: clicks.timestamp,
      device: clicks.device,
      browser: clicks.browser,
      os: clicks.os,
      country: clicks.country,
      city: clicks.city,
      linkId: clicks.linkId,
    })
    .from(clicks)
    .where(
      and(
        inArray(clicks.linkId, linkIds),
        gte(clicks.timestamp, dateThreshold)
      )
    )
    .orderBy(desc(clicks.timestamp));

  // Process click data
  const clicksByDate = new Map<string, number>();
  const deviceCounts = new Map<string, number>();
  const browserCounts = new Map<string, number>();
  const osCounts = new Map<string, number>();
  const countryCounts = new Map<string, number>();

  for (const click of tagClicks) {
    // Date trend
    const dateStr = click.timestamp.toISOString().split('T')[0];
    clicksByDate.set(dateStr, (clicksByDate.get(dateStr) || 0) + 1);

    // Device stats
    const device = click.device || 'unknown';
    deviceCounts.set(device, (deviceCounts.get(device) || 0) + 1);

    // Browser stats
    const browser = click.browser || 'unknown';
    browserCounts.set(browser, (browserCounts.get(browser) || 0) + 1);

    // OS stats
    const os = click.os || 'unknown';
    osCounts.set(os, (osCounts.get(os) || 0) + 1);

    // Country stats
    const country = click.country || 'Unknown';
    countryCounts.set(country, (countryCounts.get(country) || 0) + 1);
  }

  const totalClicksInPeriod = tagClicks.length;

  // Format results
  const clickTrend = Array.from(clicksByDate.entries())
    .map(([date, clicks]) => ({ date, clicks }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const topLinks = tagLinks
    .map(link => ({
      linkId: link.linkId,
      shortCode: link.shortCode,
      title: link.title,
      clicks: link.clicks,
    }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 10);

  const deviceStats = Array.from(deviceCounts.entries())
    .map(([device, clicks]) => ({
      device,
      clicks,
      percentage: totalClicksInPeriod > 0 ? (clicks / totalClicksInPeriod) * 100 : 0,
    }))
    .sort((a, b) => b.clicks - a.clicks);

  const browserStats = Array.from(browserCounts.entries())
    .map(([browser, clicks]) => ({
      browser,
      clicks,
      percentage: totalClicksInPeriod > 0 ? (clicks / totalClicksInPeriod) * 100 : 0,
    }))
    .sort((a, b) => b.clicks - a.clicks);

  const osStats = Array.from(osCounts.entries())
    .map(([os, clicks]) => ({
      os,
      clicks,
      percentage: totalClicksInPeriod > 0 ? (clicks / totalClicksInPeriod) * 100 : 0,
    }))
    .sort((a, b) => b.clicks - a.clicks);

  const topCountries = Array.from(countryCounts.entries())
    .map(([country, clicks]) => ({ country, clicks }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 10);

  // Get recent clicks with link info
  const recentClicksWithLinks = tagClicks.slice(0, 50).map(click => {
    const link = tagLinks.find(l => l.linkId === click.linkId);
    return {
      id: click.id,
      timestamp: click.timestamp,
      device: click.device,
      browser: click.browser,
      os: click.os,
      country: click.country,
      city: click.city,
      shortCode: link?.shortCode || 'unknown',
    };
  });

  return {
    tagId: tag.id,
    tagName: tag.name,
    tagColor: tag.color,
    totalClicks: totalClicksInPeriod,
    linksCount: linkIds.length,
    clickTrend,
    topLinks,
    deviceStats,
    browserStats,
    osStats,
    topCountries,
    recentClicks: recentClicksWithLinks,
  };
}

// Global Analytics
export interface GlobalAnalytics {
  overview: {
    totalLinks: number;
    totalClicks: number;
    activeLinks: number;
    uniqueDevices: number;
    uniqueCountries: number;
    orphanedVisits: number;
  };
  clickTrend: { date: string; clicks: number }[];
  topCountries: { country: string; clicks: number }[];
  topCities: { city: string; country: string; clicks: number }[];
  deviceStats: { device: string; clicks: number; percentage: number }[];
  browserStats: { browser: string; clicks: number; percentage: number }[];
  osStats: { os: string; clicks: number; percentage: number }[];
  topOrphanedShortCodes: { shortCode: string; visits: number }[];
}

export async function getGlobalAnalytics(
  userId: string,
  days: number = 30
): Promise<GlobalAnalytics> {
  // Calculate date threshold
  const dateThreshold = new Date();
  dateThreshold.setDate(dateThreshold.getDate() - days);

  // Get user's links
  const userLinks = await db
    .select({ id: links.id })
    .from(links)
    .where(eq(links.userId, userId));

  const linkIds = userLinks.map(l => l.id);

  // Get orphaned visits count (not tied to any link, so get all)
  const orphanedVisitsData = await db
    .select()
    .from(orphanedVisits)
    .where(gte(orphanedVisits.timestamp, dateThreshold));

  const orphanedVisitsCount = orphanedVisitsData.length;

  // Get top orphaned short codes
  const orphanedShortCodeCounts = new Map<string, number>();
  for (const visit of orphanedVisitsData) {
    orphanedShortCodeCounts.set(visit.shortCode, (orphanedShortCodeCounts.get(visit.shortCode) || 0) + 1);
  }
  const topOrphanedShortCodes = Array.from(orphanedShortCodeCounts.entries())
    .map(([shortCode, visits]) => ({ shortCode, visits }))
    .sort((a, b) => b.visits - a.visits)
    .slice(0, 10);

  if (linkIds.length === 0) {
    return {
      overview: {
        totalLinks: 0,
        totalClicks: 0,
        activeLinks: 0,
        uniqueDevices: 0,
        uniqueCountries: 0,
        orphanedVisits: orphanedVisitsCount,
      },
      clickTrend: [],
      topCountries: [],
      topCities: [],
      deviceStats: [],
      browserStats: [],
      osStats: [],
      topOrphanedShortCodes,
    };
  }

  // Get overview stats
  const [linkStats] = await db
    .select({
      totalLinks: drizzleCount(links.id),
      totalClicks: sql<number>`CAST(SUM(${links.clicks}) AS INTEGER)`,
      activeLinks: sql<number>`CAST(SUM(CASE WHEN ${links.isActive} = true THEN 1 ELSE 0 END) AS INTEGER)`,
    })
    .from(links)
    .where(eq(links.userId, userId));

  // Get all clicks in time period
  const allClicks = await db
    .select()
    .from(clicks)
    .where(
      and(
        inArray(clicks.linkId, linkIds),
        gte(clicks.timestamp, dateThreshold)
      )
    );

  // Process click data
  const clicksByDate = new Map<string, number>();
  const countryCounts = new Map<string, number>();
  const cityCounts = new Map<string, { city: string; country: string; count: number }>();
  const deviceCounts = new Map<string, number>();
  const browserCounts = new Map<string, number>();
  const osCounts = new Map<string, number>();
  const uniqueDevices = new Set<string>();
  const uniqueCountries = new Set<string>();

  for (const click of allClicks) {
    // Date trend
    const dateStr = click.timestamp.toISOString().split('T')[0];
    clicksByDate.set(dateStr, (clicksByDate.get(dateStr) || 0) + 1);

    // Country stats
    const country = click.country || 'Unknown';
    countryCounts.set(country, (countryCounts.get(country) || 0) + 1);
    if (country !== 'Unknown') uniqueCountries.add(country);

    // City stats
    const city = click.city || 'Unknown';
    const cityKey = `${city}|${country}`;
    const existing = cityCounts.get(cityKey);
    if (existing) {
      existing.count++;
    } else {
      cityCounts.set(cityKey, { city, country, count: 1 });
    }

    // Device stats
    const device = click.device || 'unknown';
    deviceCounts.set(device, (deviceCounts.get(device) || 0) + 1);
    if (device !== 'unknown') uniqueDevices.add(device);

    // Browser stats
    const browser = click.browser || 'unknown';
    browserCounts.set(browser, (browserCounts.get(browser) || 0) + 1);

    // OS stats
    const os = click.os || 'unknown';
    osCounts.set(os, (osCounts.get(os) || 0) + 1);
  }

  const totalClicksInPeriod = allClicks.length;

  // Format results
  const clickTrend = Array.from(clicksByDate.entries())
    .map(([date, clicks]) => ({ date, clicks }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const topCountries = Array.from(countryCounts.entries())
    .map(([country, clicks]) => ({ country, clicks }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 10);

  const topCities = Array.from(cityCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map(({ city, country, count }) => ({ city, country, clicks: count }));

  const deviceStats = Array.from(deviceCounts.entries())
    .map(([device, clicks]) => ({
      device,
      clicks,
      percentage: totalClicksInPeriod > 0 ? (clicks / totalClicksInPeriod) * 100 : 0,
    }))
    .sort((a, b) => b.clicks - a.clicks);

  const browserStats = Array.from(browserCounts.entries())
    .map(([browser, clicks]) => ({
      browser,
      clicks,
      percentage: totalClicksInPeriod > 0 ? (clicks / totalClicksInPeriod) * 100 : 0,
    }))
    .sort((a, b) => b.clicks - a.clicks);

  const osStats = Array.from(osCounts.entries())
    .map(([os, clicks]) => ({
      os,
      clicks,
      percentage: totalClicksInPeriod > 0 ? (clicks / totalClicksInPeriod) * 100 : 0,
    }))
    .sort((a, b) => b.clicks - a.clicks);

  return {
    overview: {
      totalLinks: linkStats?.totalLinks || 0,
      totalClicks: linkStats?.totalClicks || 0,
      activeLinks: linkStats?.activeLinks || 0,
      uniqueDevices: uniqueDevices.size,
      uniqueCountries: uniqueCountries.size,
      orphanedVisits: orphanedVisitsCount,
    },
    clickTrend,
    topCountries,
    topCities,
    deviceStats,
    browserStats,
    osStats,
    topOrphanedShortCodes,
  };
}