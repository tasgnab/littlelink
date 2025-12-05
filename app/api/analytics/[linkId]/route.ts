import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clicks, links } from "@/lib/db/schema";
import { eq, and, gte, sql } from "drizzle-orm";
import { requireReadAuth } from "@/lib/api-auth";
import { rateLimiters, applyRateLimit } from "@/lib/rate-limit";

// GET /api/analytics/[linkId] - Get analytics for a link
// Supports both session and API key authentication (read-only)
async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ linkId: string }> }
) {
  try {
    const auth = await requireReadAuth(request);
    if (auth instanceof Response) return auth;

    const { linkId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get("days") || "30");

    // Verify link belongs to user
    const [link] = await db
      .select()
      .from(links)
      .where(and(eq(links.id, linkId), eq(links.userId, auth.userId)))
      .limit(1);

    if (!link) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
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
    const deviceStats = clicksData.reduce((acc: any, click) => {
      const device = click.device || "unknown";
      acc[device] = (acc[device] || 0) + 1;
      return acc;
    }, {});

    const browserStats = clicksData.reduce((acc: any, click) => {
      const browser = click.browser || "unknown";
      acc[browser] = (acc[browser] || 0) + 1;
      return acc;
    }, {});

    const osStats = clicksData.reduce((acc: any, click) => {
      const os = click.os || "unknown";
      acc[os] = (acc[os] || 0) + 1;
      return acc;
    }, {});

    return NextResponse.json({
      totalClicks: clicksData.length,
      deviceStats,
      browserStats,
      osStats,
      recentClicks: clicksData.slice(-50), // Last 50 clicks
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}

// Export rate-limited handler
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ linkId: string }> }
) {
  return applyRateLimit(request, rateLimiters.api, () => getHandler(request, context));
}
