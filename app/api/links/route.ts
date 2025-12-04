import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { links } from "@/lib/db/schema";
import { createLinkSchema, bulkDeleteSchema } from "@/lib/validations";
import { generateShortCode } from "@/lib/utils";
import { eq, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const userLinks = await db
      .select()
      .from(links)
      .where(eq(links.userId, session.user.id))
      .orderBy(desc(links.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({ links: userLinks });
  } catch (error) {
    console.error("Error fetching links:", error);
    return NextResponse.json(
      { error: "Failed to fetch links" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validation = createLinkSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { originalUrl, shortCode, title, description, expiresAt } =
      validation.data;

    // Generate short code if not provided
    let finalShortCode = shortCode;
    if (!finalShortCode) {
      finalShortCode = generateShortCode();
      // Ensure uniqueness
      let exists = await db
        .select()
        .from(links)
        .where(eq(links.shortCode, finalShortCode))
        .limit(1);

      while (exists.length > 0) {
        finalShortCode = generateShortCode();
        exists = await db
          .select()
          .from(links)
          .where(eq(links.shortCode, finalShortCode))
          .limit(1);
      }
    } else {
      // Check if custom short code already exists
      const exists = await db
        .select()
        .from(links)
        .where(eq(links.shortCode, finalShortCode))
        .limit(1);

      if (exists.length > 0) {
        return NextResponse.json(
          { error: "Short code already exists" },
          { status: 409 }
        );
      }
    }

    const [link] = await db
      .insert(links)
      .values({
        userId: session.user.id,
        originalUrl,
        shortCode: finalShortCode,
        title,
        description,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      })
      .returning();

    return NextResponse.json({ link }, { status: 201 });
  } catch (error) {
    console.error("Error creating link:", error);
    return NextResponse.json(
      { error: "Failed to create link" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validation = bulkDeleteSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { linkIds } = validation.data;

    // Delete links that belong to the user
    await db
      .delete(links)
      .where(eq(links.userId, session.user.id));

    return NextResponse.json({ message: "Links deleted successfully" });
  } catch (error) {
    console.error("Error deleting links:", error);
    return NextResponse.json(
      { error: "Failed to delete links" },
      { status: 500 }
    );
  }
}
