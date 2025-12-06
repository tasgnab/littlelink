import { NextRequest, NextResponse } from "next/server";
import { requireWriteAuth } from "@/lib/api-auth";
import { rateLimiters, applyRateLimit } from "@/lib/rate-limit";
import * as statsService from "@/lib/services/stats";

// GET /api/stats - Get aggregate statistics
// Supports both session and API key authentication (read-only)
async function getHandler(request: NextRequest) {
  try {
    const auth = await requireWriteAuth(request);
    if (auth instanceof NextResponse) return auth;

    const stats = await statsService.getUserStats();
    return NextResponse.json(stats);

  } catch (error) {
    console.error("Error fetching links:", error);
    return NextResponse.json(
      { error: "Failed to fetch links" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return applyRateLimit(request, rateLimiters.api, () => getHandler(request));
}
