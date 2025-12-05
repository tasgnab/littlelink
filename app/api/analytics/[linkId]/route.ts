import { NextRequest, NextResponse } from "next/server";
import { requireReadAuth, requireWriteAuth } from "@/lib/api-auth";
import { rateLimiters, applyRateLimit } from "@/lib/rate-limit";
import * as analyticsService from "@/lib/services/analytics";

// GET /api/analytics/[linkId] - Get analytics for a link
// Supports both session and API key authentication (read-only)
async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ linkId: string }> }
) {
  try {
    const auth = await requireWriteAuth(request);
    if (auth instanceof Response) return auth;

    const { linkId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get("days") || "30");

    const analytics = await analyticsService.getLinkAnalytics(
      linkId,
      auth.userId,
      days
    );

    if (!analytics) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    return NextResponse.json(analytics);
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
