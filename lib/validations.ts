import { z } from "zod";

export const createLinkSchema = z.object({
  originalUrl: z.string().url({ message: "Please enter a valid URL" }),
  shortCode: z
    .string()
    .min(3, { message: "Short code must be at least 3 characters" })
    .max(20, { message: "Short code must be at most 20 characters" })
    .regex(/^[a-zA-Z0-9-_]+$/, {
      message: "Short code can only contain letters, numbers, hyphens, and underscores",
    })
    .optional(),
  title: z.string().max(200).optional(),
  description: z.string().max(500).optional(),
  expiresAt: z.string().datetime().optional(),
});

export const updateLinkSchema = z.object({
  originalUrl: z.string().url().optional(),
  title: z.string().max(200).optional(),
  description: z.string().max(500).optional(),
  isActive: z.boolean().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
});

export const createApiKeySchema = z.object({
  name: z.string().min(1).max(100),
});

export const bulkDeleteSchema = z.object({
  linkIds: z.array(z.string().uuid()),
});

export type CreateLinkInput = z.infer<typeof createLinkSchema>;
export type UpdateLinkInput = z.infer<typeof updateLinkSchema>;
export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>;
