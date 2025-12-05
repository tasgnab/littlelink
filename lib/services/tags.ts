import { db } from "@/lib/db";
import { tags } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

export interface Tag {
  id: string;
  userId: string;
  name: string;
  color: string;
  createdAt: Date;
}

export interface CreateTagParams {
  userId: string;
  name: string;
  color?: string;
}

export interface UpdateTagParams {
  name?: string;
  color?: string;
}

export async function listTags(userId: string): Promise<Tag[]> {
  return await db
    .select()
    .from(tags)
    .where(eq(tags.userId, userId))
    .orderBy(desc(tags.createdAt));
}

export async function getTag(tagId: string, userId: string): Promise<Tag | null> {
  const [tag] = await db
    .select()
    .from(tags)
    .where(and(eq(tags.id, tagId), eq(tags.userId, userId)))
    .limit(1);

  return tag || null;
}

export async function createTag(params: CreateTagParams): Promise<Tag> {
  const { userId, name, color } = params;

  // Check if tag with same name already exists
  const existing = await db
    .select()
    .from(tags)
    .where(and(eq(tags.userId, userId), eq(tags.name, name)))
    .limit(1);

  if (existing.length > 0) {
    throw new Error("Tag with this name already exists");
  }

  const [tag] = await db
    .insert(tags)
    .values({
      userId,
      name,
      color: color || undefined,
    })
    .returning();

  return tag;
}

export async function updateTag(
  tagId: string,
  userId: string,
  params: UpdateTagParams
): Promise<Tag> {
  const { name, color } = params;

  // Build update object
  const updateData: any = {};
  if (name !== undefined) updateData.name = name;
  if (color !== undefined) updateData.color = color;

  const [updatedTag] = await db
    .update(tags)
    .set(updateData)
    .where(and(eq(tags.id, tagId), eq(tags.userId, userId)))
    .returning();

  if (!updatedTag) {
    throw new Error("Tag not found");
  }

  return updatedTag;
}

export async function deleteTag(tagId: string, userId: string): Promise<void> {
  await db
    .delete(tags)
    .where(and(eq(tags.id, tagId), eq(tags.userId, userId)));
}
