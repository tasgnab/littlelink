import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tags } from "@/lib/db/schema";
import { createTagSchema } from "@/lib/validations";
import { eq, and } from "drizzle-orm";
import { requireReadAuth, requireWriteAuth } from "@/lib/api-auth";

// GET /api/tags - List all tags
// Supports both session and API key authentication (read-only)
export async function GET(request: NextRequest) {
  try {
    const auth = await requireReadAuth(request);
    if (auth instanceof Response) return auth;

    const userTags = await db
      .select()
      .from(tags)
      .where(eq(tags.userId, auth.userId))
      .orderBy(tags.name);

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
export async function POST(request: NextRequest) {
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

    // Check if tag already exists for this user
    const existing = await db
      .select()
      .from(tags)
      .where(and(eq(tags.userId, auth.userId), eq(tags.name, name)))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Tag already exists" },
        { status: 409 }
      );
    }

    const [newTag] = await db
      .insert(tags)
      .values({
        userId: auth.userId,
        name,
        color: color || "#3b82f6",
      })
      .returning();

    return NextResponse.json({ tag: newTag }, { status: 201 });
  } catch (error) {
    console.error("Error creating tag:", error);
    return NextResponse.json(
      { error: "Failed to create tag" },
      { status: 500 }
    );
  }
}
