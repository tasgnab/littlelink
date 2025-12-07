import { NextRequest, NextResponse } from "next/server";
import { rateLimiters, applyRateLimit } from "@/lib/rate-limit";
import { getAppUrl } from "@/lib/config";

// GET /api/public/links?tag=tagName - Get public links by tag name
// No authentication required - uses internal API with API key
async function getHandler(request: NextRequest) {
  try {
    // Get API key from environment
    const tagName = "littlelink";
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.error("API_KEY not configured for public endpoint");
      return NextResponse.json(
        { error: "Service configuration error" },
        { status: 500 }
      );
    }

    // Call internal /api/links endpoint with API key
    const appUrl = getAppUrl();
    const apiUrl = `${appUrl}/api/links?tag=${encodeURIComponent(tagName)}`;

    const response = await fetch(apiUrl, {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();

    // Filter links by tag name and only return active links
    const filteredLinks = data.links
      .filter((link: any) => {
        const hasTag = link.tags?.some((tag: any) => tag.name === tagName);
        return hasTag && link.isActive;
      })
      .map((link: any) => ({
        shortCode: link.shortCode,
        originalUrl: link.originalUrl,
        title: link.title,
      }));

    return NextResponse.json({ links: filteredLinks });
  } catch (error) {
    console.error("Error fetching public links:", error);
    return NextResponse.json(
      { error: "Failed to fetch links" },
      { status: 500 }
    );
  }
}

// Export rate-limited handler
export async function GET(request: NextRequest) {
  return applyRateLimit(request, rateLimiters.api, () => getHandler(request));
}
