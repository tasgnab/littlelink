import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { links, tags, linkTags } from "@/lib/db/schema";
import { createLinkSchema, bulkDeleteSchema } from "@/lib/validations";
import { generateUniqueShortCode } from "@/lib/utils";
import { eq, desc, inArray, and, sql } from "drizzle-orm";

// GET /api/links - List all links with tags
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    const tagFilter = searchParams.get("tag");

    // Build query
    let query = db
      .select({
        id: links.id,
        userId: links.userId,
        shortCode: links.shortCode,
        originalUrl: links.originalUrl,
        title: links.title,
        description: links.description,
        clicks: links.clicks,
        isActive: links.isActive,
        expiresAt: links.expiresAt,
        createdAt: links.createdAt,
        updatedAt: links.updatedAt,
      })
      .from(links)
      .where(eq(links.userId, session.user.id))
      .$dynamic();

    // Get links
    const userLinks = await query
      .orderBy(desc(links.createdAt))
      .limit(limit)
      .offset(offset);

    // Get tags for each link
    const linkIds = userLinks.map((link) => link.id);

    if (linkIds.length === 0) {
      return NextResponse.json({ links: [] });
    }

    const linkTagsData = await db
      .select({
        linkId: linkTags.linkId,
        tagId: linkTags.tagId,
        tagName: tags.name,
        tagColor: tags.color,
      })
      .from(linkTags)
      .leftJoin(tags, eq(linkTags.tagId, tags.id))
      .where(inArray(linkTags.linkId, linkIds));

    // Organize tags by link
    const linksWithTags = userLinks.map((link) => ({
      ...link,
      tags: linkTagsData
        .filter((lt) => lt.linkId === link.id)
        .map((lt) => ({
          id: lt.tagId,
          name: lt.tagName,
          color: lt.tagColor,
        })),
    }));

    // Filter by tag if specified
    const filteredLinks = tagFilter
      ? linksWithTags.filter((link) =>
          link.tags.some((tag) => tag.name === tagFilter)
        )
      : linksWithTags;

    return NextResponse.json({ links: filteredLinks });
  } catch (error) {
    console.error("Error fetching links:", error);
    return NextResponse.json(
      { error: "Failed to fetch links" },
      { status: 500 }
    );
  }
}

// POST /api/links - Create a new link with tags
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = createLinkSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { url, shortCode, title, description, expiresAt, tags: tagNames } = validation.data;

    // Generate or validate short code
    let finalShortCode: string;

    if (shortCode) {
      // Check if custom short code already exists
      const existing = await db
        .select()
        .from(links)
        .where(eq(links.shortCode, shortCode))
        .limit(1);

      if (existing.length > 0) {
        return NextResponse.json(
          { error: "Short code already exists" },
          { status: 409 }
        );
      }

      finalShortCode = shortCode;
    } else {
      finalShortCode = await generateUniqueShortCode();
    }

    // Create the link
    const [newLink] = await db
      .insert(links)
      .values({
        userId: session.user.id,
        shortCode: finalShortCode,
        originalUrl: url,
        title: title || null,
        description: description || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      })
      .returning();

    // Handle tags if provided
    if (tagNames && tagNames.length > 0) {
      // Get or create tags
      const tagIds: string[] = [];

      for (const tagName of tagNames) {
        // Check if tag exists
        let [tag] = await db
          .select()
          .from(tags)
          .where(and(eq(tags.userId, session.user.id), eq(tags.name, tagName)))
          .limit(1);

        // Create tag if it doesn't exist
        if (!tag) {
          [tag] = await db
            .insert(tags)
            .values({
              userId: session.user.id,
              name: tagName,
            })
            .returning();
        }

        tagIds.push(tag.id);
      }

      // Create link-tag associations
      if (tagIds.length > 0) {
        await db.insert(linkTags).values(
          tagIds.map((tagId) => ({
            linkId: newLink.id,
            tagId,
          }))
        );
      }

      // Fetch tags for response
      const linkTagsData = await db
        .select({
          id: tags.id,
          name: tags.name,
          color: tags.color,
        })
        .from(tags)
        .where(inArray(tags.id, tagIds));

      return NextResponse.json(
        {
          link: {
            ...newLink,
            tags: linkTagsData,
          },
        },
        { status: 201 }
      );
    }

    return NextResponse.json(
      {
        link: {
          ...newLink,
          tags: [],
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating link:", error);
    return NextResponse.json(
      { error: "Failed to create link" },
      { status: 500 }
    );
  }
}

// DELETE /api/links - Bulk delete links
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = bulkDeleteSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { linkIds } = validation.data;

    // Delete only links that belong to the user
    await db
      .delete(links)
      .where(
        and(eq(links.userId, session.user.id), inArray(links.id, linkIds))
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting links:", error);
    return NextResponse.json(
      { error: "Failed to delete links" },
      { status: 500 }
    );
  }
}
