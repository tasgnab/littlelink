import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { links, tags, linkTags } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { rateLimiters, applyRateLimit } from "@/lib/rate-limit";

// GET /api/public/links?tag=tagName - Get public links by tag name
// No authentication required
async function getHandler(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tagName = searchParams.get("tag");

    if (!tagName) {
      return NextResponse.json(
        { error: "Tag name is required" },
        { status: 400 }
      );
    }

    // Find the tag by name
    const [tag] = await db
      .select()
      .from(tags)
      .where(eq(tags.name, tagName))
      .limit(1);

    if (!tag) {
      return NextResponse.json({ links: [] });
    }

    // Get all links with this tag that are active
    const linksWithTag = await db
      .select({
        id: links.id,
        shortCode: links.shortCode,
        originalUrl: links.originalUrl,
        title: links.title,
        description: links.description,
        clicks: links.clicks,
        createdAt: links.createdAt,
      })
      .from(links)
      .innerJoin(linkTags, eq(links.id, linkTags.linkId))
      .where(
        and(
          eq(linkTags.tagId, tag.id),
          eq(links.isActive, true)
        )
      )
      .orderBy(links.createdAt);

    return NextResponse.json({ links: linksWithTag });
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
