import { config } from "@/lib/config";
import { registerProvider, getProviders } from "./geolocation/registry";
import { createAbstractAPIProvider } from "./geolocation/providers/abstract-api";
import type { GeoLocation } from "./geolocation/types";
import { createIPGeolocationProvider } from "./geolocation/providers/ipgeolocation";

// Register providers on module load
registerProvider(
  "abstract-api",
  createAbstractAPIProvider(config.geolocation.abstractApi.apiKey)
);

registerProvider(
  "ipgeolocation",
  createIPGeolocationProvider(config.geolocation.ipGeolocation.apiKey)
);

// Export types
export type { GeoLocation };

/**
 * Check if an IP address is localhost or private (RFC 1918)
 */
function isPrivateIP(ip: string): boolean {
  // Localhost
  if (ip === "127.0.0.1" || ip === "::1") {
    return true;
  }

  // RFC 1918 private address ranges:
  // - 10.0.0.0 to 10.255.255.255 (Class A)
  // - 172.16.0.0 to 172.31.255.255 (Class B)
  // - 192.168.0.0 to 192.168.255.255 (Class C)
  if (ip.startsWith("10.") || ip.startsWith("192.168.")) {
    return true;
  }

  // Check 172.16.0.0 to 172.31.255.255
  if (ip.startsWith("172.")) {
    const parts = ip.split(".");
    const secondOctet = parseInt(parts[1], 10);
    if (secondOctet >= 16 && secondOctet <= 31) {
      return true;
    }
  }

  return false;
}

/**
 * Lookup geolocation for an IP address using the configured providers with fallback
 * Tries each provider in order until one returns valid data
 * Returns null values if all providers fail or return empty results
 */
export async function lookupIP(ip: string | null): Promise<GeoLocation> {
  const emptyLocation: GeoLocation = { country: null, city: null };

  // Return empty if no IP provided
  if (!ip) {
    return emptyLocation;
  }

  // Extract first IP if multiple IPs in x-forwarded-for
  const firstIp = ip.split(",")[0].trim();

  // Handle localhost and private IPs - return immediately without calling providers
  if (isPrivateIP(firstIp)) {
    return { country: "Local", city: null };
  }

  const providers = getProviders(config.geolocation.providers);

  // Try each provider in order
  for (const provider of providers) {
    try {
      const result = await provider.lookupIP(firstIp);

      // If we got valid data (at least one field is not null), return it
      if (result.country !== null || result.city !== null) {
        return result;
      }

      // Provider returned empty data, try next provider
      console.log(`Provider '${provider.name}' returned no data, trying next provider`);
    } catch (error) {
      // Provider failed, try next one
      console.error(`Provider '${provider.name}' failed:`, error);
    }
  }

  // All providers failed or returned empty data
  return emptyLocation;
}
