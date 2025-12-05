import { NextRequest, NextResponse } from "next/server";
import { createLinkSchema, bulkDeleteSchema } from "@/lib/validations";
import { requireReadAuth, requireWriteAuth } from "@/lib/api-auth";
import { rateLimiters, applyRateLimit } from "@/lib/rate-limit";
import * as linksService from "@/lib/services/links";

// GET /api/links - List all links with tags
// Supports both session and API key authentication (read-only)
async function getHandler(request: NextRequest) {
  try {
    const auth = await requireReadAuth(request);
    if (auth instanceof Response) return auth;

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    const tagFilter = searchParams.get("tag");

    const { links, total } = await linksService.listLinks({
      userId: auth.userId,
      limit,
      offset,
      tagFilter,
    });

    return NextResponse.json({ links, total });
  } catch (error) {
    console.error("Error fetching links:", error);
    return NextResponse.json(
      { error: "Failed to fetch links" },
      { status: 500 }
    );
  }
}

// POST /api/links - Create a new link with tags
// Requires session authentication (write access)
async function postHandler(request: NextRequest) {
  try {
    const auth = await requireWriteAuth(request);
    if (auth instanceof Response) return auth;

    const body = await request.json();
    const validation = createLinkSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { url, shortCode, title, description, expiresAt, tags: tagNames } = validation.data;

    const link = await linksService.createLink({
      userId: auth.userId,
      url,
      shortCode,
      title,
      description,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      tags: tagNames,
    });

    return NextResponse.json({ link }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating link:", error);

    if (error.message === "Short code already exists") {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create link" },
      { status: 500 }
    );
  }
}

// DELETE /api/links - Bulk delete links
// Requires session authentication (write access)
async function deleteHandler(request: NextRequest) {
  try {
    const auth = await requireWriteAuth(request);
    if (auth instanceof Response) return auth;

    const body = await request.json();
    const validation = bulkDeleteSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { linkIds } = validation.data;

    await linksService.bulkDeleteLinks(linkIds, auth.userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting links:", error);
    return NextResponse.json(
      { error: "Failed to delete links" },
      { status: 500 }
    );
  }
}

// Export rate-limited handlers
export async function GET(request: NextRequest) {
  return applyRateLimit(request, rateLimiters.api, () => getHandler(request));
}

export async function POST(request: NextRequest) {
  return applyRateLimit(request, rateLimiters.api, () => postHandler(request));
}

export async function DELETE(request: NextRequest) {
  return applyRateLimit(request, rateLimiters.api, () => deleteHandler(request));
}
