import { db } from "@/lib/db";
import { geoLiteCityBlocksIPv4, geoLiteCityLocations } from "@/lib/db/schema";
import { sql } from "drizzle-orm";

export interface GeoLocation {
  country: string | null;
  city: string | null;
}

/**
 * Lookup geolocation for an IP address using database tables
 * Uses PostgreSQL CIDR operators for efficient IP range lookups
 * Returns null if the IP is not found or if lookup fails
 */
export async function lookupIP(ip: string | null): Promise<GeoLocation> {
  const emptyLocation: GeoLocation = { country: null, city: null };

  // Return empty if no IP provided
  if (!ip) {
    return emptyLocation;
  }

  try {
    // Handle localhost and private IPs
    if (
      ip === "127.0.0.1" ||
      ip === "::1" ||
      ip.startsWith("192.168.") ||
      ip.startsWith("10.") ||
      ip.startsWith("172.")
    ) {
      return { country: "Local", city: "Local" };
    }

    // Extract first IP if multiple IPs in x-forwarded-for
    const firstIp = ip.split(",")[0].trim();

    // Query the database to find the IP block that contains this IP
    // Using PostgreSQL's << operator: checks if IP is contained in CIDR range
    const [block] = await db
      .select({
        geonameId: geoLiteCityBlocksIPv4.geonameId,
        registeredCountryGeonameId: geoLiteCityBlocksIPv4.registeredCountryGeonameId,
      })
      .from(geoLiteCityBlocksIPv4)
      .where(sql`${firstIp}::inet << ${geoLiteCityBlocksIPv4.network}`)
      .limit(1);

    // If no block found, return empty
    if (!block) {
      return emptyLocation;
    }

    // Use geonameId first, fall back to registeredCountryGeonameId
    const geonameId = block.geonameId || block.registeredCountryGeonameId;

    // If no geoname ID, return empty
    if (!geonameId) {
      return emptyLocation;
    }

    // Look up the location details
    const [location] = await db
      .select({
        countryName: geoLiteCityLocations.countryName,
        cityName: geoLiteCityLocations.cityName,
      })
      .from(geoLiteCityLocations)
      .where(sql`${geoLiteCityLocations.geonameId} = ${geonameId}`)
      .limit(1);

    // If no location found, return empty
    if (!location) {
      return emptyLocation;
    }

    return {
      country: location.countryName,
      city: location.cityName,
    };
  } catch (error) {
    // Log error and return empty on failure
    console.error("Error looking up IP geolocation:", error);
    return emptyLocation;
  }
}

/**
 * Initialize GeoIP (no-op for database-based implementation)
 * Kept for backward compatibility
 */
export async function initializeGeoIP(): Promise<void> {
  // No initialization needed - database is always ready
  console.log("✅ GeoIP using database tables (no initialization required)");
}

/**
 * Check if GeoIP is available
 * Always returns true for database implementation
 */
export function isGeoIPAvailable(): boolean {
  return true;
}

/**
 * Close the reader (no-op for database implementation)
 * Kept for backward compatibility
 */
export function closeGeoIP(): void {
  // No cleanup needed for database implementation
}
