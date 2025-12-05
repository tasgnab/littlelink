import { z } from "zod";

// Reserved route names that cannot be used as short codes
const RESERVED_ROUTES = [
  "dashboard",
  "auth",
  "api",
  "_next",
  "favicon.ico",
];

export const createLinkSchema = z.object({
  url: z.string().url("Please enter a valid URL"),
  shortCode: z
    .string()
    .min(3, "Short code must be at least 3 characters")
    .max(20, "Short code must be at most 20 characters")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Short code can only contain letters, numbers, hyphens, and underscores"
    )
    .refine(
      (code) => !RESERVED_ROUTES.includes(code?.toLowerCase() || ""),
      "This short code is reserved and cannot be used"
    )
    .optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
  tags: z.array(z.string()).optional(),
});

export const updateLinkSchema = z.object({
  url: z.string().url("Please enter a valid URL").optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
  tags: z.array(z.string()).optional(),
});

export const createTagSchema = z.object({
  name: z.string().min(1, "Tag name is required").max(50, "Tag name is too long"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format").optional(),
});

export const updateTagSchema = z.object({
  name: z.string().min(1, "Tag name is required").max(50, "Tag name is too long").optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format").optional(),
});

export const createApiKeySchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
});

export const bulkDeleteSchema = z.object({
  linkIds: z.array(z.string().uuid()),
});
