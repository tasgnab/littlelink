import { config } from "@/lib/config";
import { registerProvider, getProvider } from "./geolocation/registry";
import { createAbstractAPIProvider } from "./geolocation/providers/abstract-api";
import type { GeoLocation } from "./geolocation/types";

// Register providers on module load
registerProvider(
  "abstract-api",
  createAbstractAPIProvider(config.geolocation.abstractApi.apiKey)
);

// Export types
export type { GeoLocation };

/**
 * Lookup geolocation for an IP address using the configured provider
 * Returns null values if the IP is not found or if lookup fails
 */
export async function lookupIP(ip: string | null): Promise<GeoLocation> {
  const provider = getProvider(config.geolocation.provider);
  return provider.lookupIP(ip);
}
