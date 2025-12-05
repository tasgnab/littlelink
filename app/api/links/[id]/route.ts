import { NextRequest, NextResponse } from "next/server";
import { updateLinkSchema } from "@/lib/validations";
import { requireReadAuth, requireWriteAuth } from "@/lib/api-auth";
import { rateLimiters, applyRateLimit } from "@/lib/rate-limit";
import * as linksService from "@/lib/services/links";

// GET /api/links/[id] - Get a single link with tags
// Supports both session and API key authentication (read-only)
async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireReadAuth(request);
    if (auth instanceof Response) return auth;

    const { id } = await params;

    const link = await linksService.getLink(id, auth.userId);

    if (!link) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    return NextResponse.json({ link });
  } catch (error) {
    console.error("Error fetching link:", error);
    return NextResponse.json(
      { error: "Failed to fetch link" },
      { status: 500 }
    );
  }
}

// PATCH /api/links/[id] - Update a link and its tags
// Requires session authentication (write access)
async function patchHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireWriteAuth(request);
    if (auth instanceof Response) return auth;

    const { id } = await params;
    const body = await request.json();
    const validation = updateLinkSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { tags: tagNames, expiresAt, ...linkData } = validation.data;

    const link = await linksService.updateLink(id, auth.userId, {
      ...linkData,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      tags: tagNames,
    });

    return NextResponse.json({ link });
  } catch (error: any) {
    console.error("Error updating link:", error);

    if (error.message === "Link not found") {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update link" },
      { status: 500 }
    );
  }
}

// DELETE /api/links/[id] - Delete a link
// Requires session authentication (write access)
async function deleteHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireWriteAuth(request);
    if (auth instanceof Response) return auth;

    const { id } = await params;

    await linksService.deleteLink(id, auth.userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting link:", error);
    return NextResponse.json(
      { error: "Failed to delete link" },
      { status: 500 }
    );
  }
}

// Export rate-limited handlers
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return applyRateLimit(request, rateLimiters.api, () => getHandler(request, context));
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return applyRateLimit(request, rateLimiters.api, () => patchHandler(request, context));
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return applyRateLimit(request, rateLimiters.api, () => deleteHandler(request, context));
}
