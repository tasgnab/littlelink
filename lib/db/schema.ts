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

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: uuid("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (verificationToken) => [
    primaryKey({
      columns: [verificationToken.identifier, verificationToken.token],
    }),
  ]
);

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

// GeoLite2 City Locations table
// Stores location data from MaxMind GeoLite2 City database
export const geoLiteCityLocations = pgTable(
  "geoLiteCityLocations",
  {
    geonameId: integer("geoname_id").primaryKey().notNull(),
    localeCode: varchar("locale_code", { length: 10 }).notNull(),
    continentCode: varchar("continent_code", { length: 2 }),
    continentName: text("continent_name"),
    countryIsoCode: varchar("country_iso_code", { length: 2 }),
    countryName: text("country_name"),
    subdivision1IsoCode: varchar("subdivision_1_iso_code", { length: 10 }),
    subdivision1Name: text("subdivision_1_name"),
    subdivision2IsoCode: varchar("subdivision_2_iso_code", { length: 10 }),
    subdivision2Name: text("subdivision_2_name"),
    cityName: text("city_name"),
    metroCode: integer("metro_code"),
    timeZone: text("time_zone"),
    isInEuropeanUnion: boolean("is_in_european_union").notNull().default(false),
  },
  (table) => [
    index("country_iso_idx").on(table.countryIsoCode),
    index("city_name_idx").on(table.cityName),
  ]
);

// GeoLite2 City Blocks IPv4 table
// Maps IP address ranges (CIDR) to geoname_id for geolocation lookups
export const geoLiteCityBlocksIPv4 = pgTable(
  "geoLiteCityBlocksIPv4",
  {
    network: cidr("network").primaryKey().notNull(),
    geonameId: integer("geoname_id"),
    registeredCountryGeonameId: integer("registered_country_geoname_id"),
    representedCountryGeonameId: integer("represented_country_geoname_id"),
    isAnonymousProxy: boolean("is_anonymous_proxy").notNull().default(false),
    isSatelliteProvider: boolean("is_satellite_provider").notNull().default(false),
    postalCode: varchar("postal_code", { length: 20 }),
    latitude: doublePrecision("latitude"),
    longitude: doublePrecision("longitude"),
    accuracyRadius: integer("accuracy_radius"),
    isAnycast: boolean("is_anycast"),
  },
  (table) => [
    index("geoname_id_idx").on(table.geonameId),
    index("network_idx").on(table.network), // For efficient IP lookups using CIDR operators
  ]
);
