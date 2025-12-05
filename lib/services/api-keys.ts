import { db } from "@/lib/db";
import { apiKeys } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { customAlphabet } from "nanoid";

const nanoid = customAlphabet(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  32
);

export interface ApiKey {
  id: string;
  userId: string;
  name: string;
  key: string;
  lastUsed: Date | null;
  createdAt: Date;
}

export interface ApiKeyListItem {
  id: string;
  name: string;
  lastUsed: Date | null;
  createdAt: Date;
}

export async function listApiKeys(userId: string): Promise<ApiKeyListItem[]> {
  return await db
    .select({
      id: apiKeys.id,
      name: apiKeys.name,
      lastUsed: apiKeys.lastUsed,
      createdAt: apiKeys.createdAt,
    })
    .from(apiKeys)
    .where(eq(apiKeys.userId, userId));
}

export async function createApiKey(userId: string, name: string): Promise<ApiKey> {
  const key = `sk_${nanoid()}`;

  const [newApiKey] = await db
    .insert(apiKeys)
    .values({
      userId,
      name,
      key,
    })
    .returning();

  return newApiKey;
}

export async function deleteApiKey(id: string, userId: string): Promise<boolean> {
  const [deletedKey] = await db
    .delete(apiKeys)
    .where(and(eq(apiKeys.id, id), eq(apiKeys.userId, userId)))
    .returning();

  return !!deletedKey;
}
