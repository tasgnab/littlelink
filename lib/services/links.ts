import { db } from "@/lib/db";
import { links, tags, linkTags } from "@/lib/db/schema";
import { eq, desc, inArray, and, sql } from "drizzle-orm";
import { generateUniqueShortCode, generateRandomTagColor } from "@/lib/utils";

export interface LinkWithTags {
  id: string;
  userId: string;
  shortCode: string;
  originalUrl: string;
  title: string | null;
  description: string | null;
  clicks: number;
  isActive: boolean;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  tags: Array<{
    id: string;
    name: string;
    color: string;
  }>;
}

export interface Link {
  id: string;
  shortCode: string;
  originalUrl: string;
  title: string | null;
  description: string | null;
  isActive: boolean;
  expiresAt: Date | null;
  clicks: number;
}

export interface ListLinksParams {
  userId: string;
  limit?: number;
  offset?: number;
  tagFilter?: string | null;
}

export interface CreateLinkParams {
  userId: string;
  url: string;
  shortCode?: string;
  title?: string;
  description?: string;
  expiresAt?: Date;
  tags?: string[];
}

export interface UpdateLinkParams {
  url?: string;
  title?: string | null;
  description?: string | null;
  isActive?: boolean;
  expiresAt?: Date | null;
  tags?: string[];
}

export async function listLinks(params: ListLinksParams): Promise<{
  links: LinkWithTags[];
  total: number;
}> {
  const { userId, limit = 50, offset = 0, tagFilter } = params;

  // Get total count
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(links)
    .where(eq(links.userId, userId));

  // Get links
  const userLinks = await db
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
    .where(eq(links.userId, userId))
    .orderBy(desc(links.createdAt))
    .limit(limit)
    .offset(offset);

  if (userLinks.length === 0) {
    return { links: [], total: count };
  }

  // Get tags for each link
  const linkIds = userLinks.map((link) => link.id);

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
        name: lt.tagName!,
        color: lt.tagColor!,
      })),
  }));

  // Filter by tag if specified
  const filteredLinks = tagFilter
    ? linksWithTags.filter((link) =>
        link.tags.some((tag) => tag.name === tagFilter)
      )
    : linksWithTags;

  // Return total count for filtered or unfiltered results
  const totalCount = tagFilter ? filteredLinks.length : count;

  return { links: filteredLinks, total: totalCount };
}

export async function getLink(linkId: string, userId: string): Promise<LinkWithTags | null> {
  const [link] = await db
    .select()
    .from(links)
    .where(and(eq(links.id, linkId), eq(links.userId, userId)))
    .limit(1);

  if (!link) {
    return null;
  }

  // Get tags for the link
  const linkTagsData = await db
    .select({
      id: tags.id,
      name: tags.name,
      color: tags.color,
    })
    .from(linkTags)
    .leftJoin(tags, eq(linkTags.tagId, tags.id))
    .where(eq(linkTags.linkId, linkId));

  return {
    ...link,
    tags: linkTagsData.map((t) => ({
      id: t.id!,
      name: t.name!,
      color: t.color!,
    })),
  };
}

export async function createLink(params: CreateLinkParams): Promise<LinkWithTags> {
  const { userId, url, shortCode, title, description, expiresAt, tags: tagNames } = params;

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
      throw new Error("Short code already exists");
    }

    finalShortCode = shortCode;
  } else {
    finalShortCode = await generateUniqueShortCode();
  }

  // Create the link
  const [newLink] = await db
    .insert(links)
    .values({
      userId,
      shortCode: finalShortCode,
      originalUrl: url,
      title: title || null,
      description: description || null,
      expiresAt: expiresAt || null,
    })
    .returning();

  // Handle tags if provided
  let resultTags: Array<{ id: string; name: string; color: string }> = [];

  if (tagNames && tagNames.length > 0) {
    const tagIds: string[] = [];

    for (const tagName of tagNames) {
      // Check if tag exists
      let [tag] = await db
        .select()
        .from(tags)
        .where(and(eq(tags.userId, userId), eq(tags.name, tagName)))
        .limit(1);

      // Create tag if it doesn't exist
      if (!tag) {
        [tag] = await db
          .insert(tags)
          .values({
            userId,
            name: tagName,
            color: generateRandomTagColor(),
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

      // Fetch tags for response
      const linkTagsData = await db
        .select({
          id: tags.id,
          name: tags.name,
          color: tags.color,
        })
        .from(tags)
        .where(inArray(tags.id, tagIds));

      resultTags = linkTagsData;
    }
  }

  return {
    ...newLink,
    tags: resultTags,
  };
}

export async function updateLink(
  linkId: string,
  userId: string,
  params: UpdateLinkParams
): Promise<LinkWithTags> {
  const { url, title, description, isActive, expiresAt, tags: tagNames } = params;

  // Build update object
  const updateData: any = {};
  if (url !== undefined) updateData.originalUrl = url;
  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (isActive !== undefined) updateData.isActive = isActive;
  if (expiresAt !== undefined) updateData.expiresAt = expiresAt;

  // Update link
  const [updatedLink] = await db
    .update(links)
    .set(updateData)
    .where(and(eq(links.id, linkId), eq(links.userId, userId)))
    .returning();

  if (!updatedLink) {
    throw new Error("Link not found");
  }

  // Handle tags if provided
  if (tagNames !== undefined) {
    // Delete existing tag associations
    await db.delete(linkTags).where(eq(linkTags.linkId, linkId));

    if (tagNames.length > 0) {
      const tagIds: string[] = [];

      for (const tagName of tagNames) {
        // Check if tag exists
        let [tag] = await db
          .select()
          .from(tags)
          .where(and(eq(tags.userId, userId), eq(tags.name, tagName)))
          .limit(1);

        // Create tag if it doesn't exist
        if (!tag) {
          [tag] = await db
            .insert(tags)
            .values({
              userId,
              name: tagName,
              color: generateRandomTagColor(),
            })
            .returning();
        }

        tagIds.push(tag.id);
      }

      // Create new link-tag associations
      if (tagIds.length > 0) {
        await db.insert(linkTags).values(
          tagIds.map((tagId) => ({
            linkId,
            tagId,
          }))
        );
      }
    }
  }

  // Fetch updated link with tags
  const link = await getLink(linkId, userId);
  if (!link) {
    throw new Error("Link not found after update");
  }

  return link;
}

export async function deleteLink(linkId: string, userId: string): Promise<void> {
  await db
    .delete(links)
    .where(and(eq(links.id, linkId), eq(links.userId, userId)));
}

export async function bulkDeleteLinks(linkIds: string[], userId: string): Promise<void> {
  await db
    .delete(links)
    .where(and(eq(links.userId, userId), inArray(links.id, linkIds)));
}


export async function getLinkByShortCode(shortCode: string): Promise<Link | null> {
  const [link] = await db
    .select()
    .from(links)
    .where(eq(links.shortCode, shortCode))
    .limit(1);

  if (!link) {
    return null;
  }

  return {
    ...link,
  };
}