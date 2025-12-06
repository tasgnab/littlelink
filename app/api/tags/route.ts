import { NextRequest, NextResponse } from "next/server";
import { createTagSchema } from "@/lib/validations";
import { requireWriteAuth } from "@/lib/api-auth";
import { rateLimiters, applyRateLimit } from "@/lib/rate-limit";
import * as tagsService from "@/lib/services/tags";

// GET /api/tags - List all tags
// Supports both session and API key authentication (read-only)
async function getHandler(request: NextRequest) {
  try {
    const auth = await requireWriteAuth(request);
    if (auth instanceof Response) return auth;

    const userTags = await tagsService.listTags(auth.userId);

    return NextResponse.json({ tags: userTags });
  } catch (error) {
    console.error("Error fetching tags:", error);
    return NextResponse.json(
      { error: "Failed to fetch tags" },
      { status: 500 }
    );
  }
}

// POST /api/tags - Create a new tag
// Requires session authentication (write access)
async function postHandler(request: NextRequest) {
  try {
    const auth = await requireWriteAuth(request);
    if (auth instanceof Response) return auth;

    const body = await request.json();
    const validation = createTagSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { name, color } = validation.data;

    const newTag = await tagsService.createTag({
      userId: auth.userId,
      name,
      color,
    });

    return NextResponse.json({ tag: newTag }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating tag:", error);

    if (error.message === "Tag with this name already exists") {
      return NextResponse.json(
        { error: "Tag already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create tag" },
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
