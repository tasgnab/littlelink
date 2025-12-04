import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { links, tags, linkTags } from "@/lib/db/schema";
import { updateLinkSchema } from "@/lib/validations";
import { eq, and, inArray } from "drizzle-orm";
import { requireReadAuth, requireWriteAuth } from "@/lib/api-auth";

// GET /api/links/[id] - Get a single link with tags
// Supports both session and API key authentication (read-only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireReadAuth(request);
    if (auth instanceof Response) return auth;

    const { id } = await params;

    const [link] = await db
      .select()
      .from(links)
      .where(and(eq(links.id, id), eq(links.userId, auth.userId)))
      .limit(1);

    if (!link) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    // Get tags for this link
    const linkTagsData = await db
      .select({
        id: tags.id,
        name: tags.name,
        color: tags.color,
      })
      .from(linkTags)
      .leftJoin(tags, eq(linkTags.tagId, tags.id))
      .where(eq(linkTags.linkId, id));

    return NextResponse.json({
      link: {
        ...link,
        tags: linkTagsData,
      },
    });
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
export async function PATCH(
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

    const { tags: tagNames, ...linkData } = validation.data;

    // Update link data
    const updateData: any = { ...linkData, updatedAt: new Date() };

    if (updateData.expiresAt) {
      updateData.expiresAt = new Date(updateData.expiresAt);
    }

    const [updatedLink] = await db
      .update(links)
      .set(updateData)
      .where(and(eq(links.id, id), eq(links.userId, auth.userId)))
      .returning();

    if (!updatedLink) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    // Handle tags update if provided
    if (tagNames !== undefined) {
      // Delete existing link-tag associations
      await db.delete(linkTags).where(eq(linkTags.linkId, id));

      // Add new tags
      if (tagNames && tagNames.length > 0) {
        const tagIds: string[] = [];

        for (const tagName of tagNames) {
          // Check if tag exists
          let [tag] = await db
            .select()
            .from(tags)
            .where(and(eq(tags.userId, auth.userId), eq(tags.name, tagName)))
            .limit(1);

          // Create tag if it doesn't exist
          if (!tag) {
            [tag] = await db
              .insert(tags)
              .values({
                userId: auth.userId,
                name: tagName,
              })
              .returning();
          }

          tagIds.push(tag.id);
        }

        // Create new link-tag associations
        if (tagIds.length > 0) {
          await db.insert(linkTags).values(
            tagIds.map((tagId) => ({
              linkId: id,
              tagId,
            }))
          );
        }
      }
    }

    // Fetch tags for response
    const linkTagsData = await db
      .select({
        id: tags.id,
        name: tags.name,
        color: tags.color,
      })
      .from(linkTags)
      .leftJoin(tags, eq(linkTags.tagId, tags.id))
      .where(eq(linkTags.linkId, id));

    return NextResponse.json({
      link: {
        ...updatedLink,
        tags: linkTagsData,
      },
    });
  } catch (error) {
    console.error("Error updating link:", error);
    return NextResponse.json(
      { error: "Failed to update link" },
      { status: 500 }
    );
  }
}

// DELETE /api/links/[id] - Delete a link
// Requires session authentication (write access)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireWriteAuth(request);
    if (auth instanceof Response) return auth;

    const { id } = await params;

    const [deletedLink] = await db
      .delete(links)
      .where(and(eq(links.id, id), eq(links.userId, auth.userId)))
      .returning();

    if (!deletedLink) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting link:", error);
    return NextResponse.json(
      { error: "Failed to delete link" },
      { status: 500 }
    );
  }
}
