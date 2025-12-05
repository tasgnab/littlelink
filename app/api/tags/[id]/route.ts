import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tags } from "@/lib/db/schema";
import { updateTagSchema } from "@/lib/validations";
import { eq, and } from "drizzle-orm";
import { requireWriteAuth } from "@/lib/api-auth";
import { rateLimiters, applyRateLimit } from "@/lib/rate-limit";

// PATCH /api/tags/[id] - Update a tag
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
    const validation = updateTagSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const [updatedTag] = await db
      .update(tags)
      .set(validation.data)
      .where(and(eq(tags.id, id), eq(tags.userId, auth.userId)))
      .returning();

    if (!updatedTag) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }

    return NextResponse.json({ tag: updatedTag });
  } catch (error) {
    console.error("Error updating tag:", error);
    return NextResponse.json(
      { error: "Failed to update tag" },
      { status: 500 }
    );
  }
}

// DELETE /api/tags/[id] - Delete a tag
// Requires session authentication (write access)
async function deleteHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireWriteAuth(request);
    if (auth instanceof Response) return auth;

    const { id } = await params;

    const [deletedTag] = await db
      .delete(tags)
      .where(and(eq(tags.id, id), eq(tags.userId, auth.userId)))
      .returning();

    if (!deletedTag) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting tag:", error);
    return NextResponse.json(
      { error: "Failed to delete tag" },
      { status: 500 }
    );
  }
}

// Export rate-limited handlers
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
