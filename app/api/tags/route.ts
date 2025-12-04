import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { tags } from "@/lib/db/schema";
import { createTagSchema } from "@/lib/validations";
import { eq, and } from "drizzle-orm";

// GET /api/tags - List all tags
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userTags = await db
      .select()
      .from(tags)
      .where(eq(tags.userId, session.user.id))
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
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
      .where(and(eq(tags.userId, session.user.id), eq(tags.name, name)))
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
        userId: session.user.id,
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
