import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  uuid,
  varchar,
  primaryKey,
  index,
  doublePrecision,
  cidr,
} from "drizzle-orm/pg-core";
import type { AdapterAccount } from "@auth/core/adapters";

// NextAuth tables
export const users = pgTable("user", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name"),
  email: text("email").unique().notNull(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
});

export const accounts = pgTable(
  "account",
  {
    userId: uuid("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccount["type"]>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  ]
);

// Note: sessions and verificationTokens tables are not needed
// This app uses JWT strategy (not database sessions) and OAuth (not email verification)

// Links table
export const links = pgTable(
  "links",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    shortCode: varchar("shortCode", { length: 20 }).notNull().unique(),
    originalUrl: text("originalUrl").notNull(),
    title: text("title"),
    description: text("description"),
    clicks: integer("clicks").default(0).notNull(),
    isActive: boolean("isActive").default(true).notNull(),
    expiresAt: timestamp("expiresAt", { mode: "date" }),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("shortCode_idx").on(table.shortCode),
    index("userId_idx").on(table.userId),
  ]
);

// Clicks tracking table
export const clicks = pgTable(
  "clicks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    linkId: uuid("linkId")
      .notNull()
      .references(() => links.id, { onDelete: "cascade" }),
    timestamp: timestamp("timestamp", { mode: "date" }).defaultNow().notNull(),
    referer: text("referer"),
    userAgent: text("userAgent"),
    ip: text("ip"),
    country: text("country"),
    city: text("city"),
    device: text("device"),
    browser: text("browser"),
    os: text("os"),
  },
  (table) => [
    index("linkId_idx").on(table.linkId),
    index("timestamp_idx").on(table.timestamp),
  ]
);

// API Keys table
export const apiKeys = pgTable("apiKeys", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  key: text("key").notNull().unique(),
  lastUsed: timestamp("lastUsed", { mode: "date" }),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
});

// Tags table
export const tags = pgTable(
  "tags",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 50 }).notNull(),
    color: varchar("color", { length: 7 }).notNull().default("#3b82f6"),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("userId_name_idx").on(table.userId, table.name),
  ]
);

// Link Tags junction table (many-to-many)
export const linkTags = pgTable(
  "linkTags",
  {
    linkId: uuid("linkId")
      .notNull()
      .references(() => links.id, { onDelete: "cascade" }),
    tagId: uuid("tagId")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({
      columns: [table.linkId, table.tagId],
    }),
    index("linkId_tag_idx").on(table.linkId),
    index("tagId_link_idx").on(table.tagId),
  ]
);

// Orphaned visits table (404 tracking)
export const orphanedVisits = pgTable(
  "orphanedVisits",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    shortCode: varchar("shortCode", { length: 255 }).notNull(),
    timestamp: timestamp("timestamp", { mode: "date" }).defaultNow().notNull(),
    referer: text("referer"),
    userAgent: text("userAgent"),
    ip: text("ip"),
    country: text("country"),
    city: text("city"),
    device: text("device"),
    browser: text("browser"),
    os: text("os"),
  },
  (table) => [
    index("shortCode_orphan_idx").on(table.shortCode),
    index("timestamp_orphan_idx").on(table.timestamp),
  ]
);
