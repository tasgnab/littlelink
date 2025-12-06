import { NextRequest, NextResponse } from "next/server";
import { requireWriteAuth } from "@/lib/api-auth";
import { rateLimiters, applyRateLimit } from "@/lib/rate-limit";
import * as analyticsService from "@/lib/services/analytics";

// GET /api/analytics/tags/[id] - Get analytics for a specific tag
// Supports both session and API key authentication (read-only)
async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireWriteAuth(request);
    if (auth instanceof Response) return auth;

    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get("days") || "30");

    const tagAnalytics = await analyticsService.getIndividualTagAnalytics(
      id,
      auth.userId,
      days
    );

    if (!tagAnalytics) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }

    return NextResponse.json(tagAnalytics);
  } catch (error) {
    console.error("Error fetching tag analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch tag analytics" },
      { status: 500 }
    );
  }
}

// Export rate-limited handler
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return applyRateLimit(request, rateLimiters.api, () => getHandler(request, context));
}
