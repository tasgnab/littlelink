import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { clicks, links } from "@/lib/db/schema";
import { eq, and, sql, gte } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ linkId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { linkId } = await params;
    const { searchParams } = req.nextUrl;
    const days = parseInt(searchParams.get("days") || "30");

    // Verify the link belongs to the user
    const [link] = await db
      .select()
      .from(links)
      .where(and(eq(links.id, linkId), eq(links.userId, session.user.id)))
      .limit(1);

    if (!link) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);

    // Get click data
    const clickData = await db
      .select()
      .from(clicks)
      .where(
        and(eq(clicks.linkId, linkId), gte(clicks.timestamp, dateThreshold))
      );

    // Aggregate data
    const totalClicks = clickData.length;

    const clicksByDate = clickData.reduce(
      (acc, click) => {
        const date = click.timestamp.toISOString().split("T")[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const clicksByCountry = clickData.reduce(
      (acc, click) => {
        const country = click.country || "Unknown";
        acc[country] = (acc[country] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const clicksByDevice = clickData.reduce(
      (acc, click) => {
        const device = click.device || "Unknown";
        acc[device] = (acc[device] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const clicksByBrowser = clickData.reduce(
      (acc, click) => {
        const browser = click.browser || "Unknown";
        acc[browser] = (acc[browser] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const clicksByReferer = clickData.reduce(
      (acc, click) => {
        const referer = click.referer || "Direct";
        acc[referer] = (acc[referer] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return NextResponse.json({
      totalClicks,
      clicksByDate,
      clicksByCountry,
      clicksByDevice,
      clicksByBrowser,
      clicksByReferer,
      recentClicks: clickData.slice(0, 100),
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
