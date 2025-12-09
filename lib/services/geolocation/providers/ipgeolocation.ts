import type { GeoLocation, GeoLocationProvider } from "../types";

/**
 * Abstract API IP Geolocation Provider
 * Uses Abstract API's IP Intelligence API for IP geolocation lookups
 * Documentation: https://docs.abstractapi.com/ip-geolocation
 */

interface IPGeolocationResponse {
  ip: string;
  location: {
    city: string | null;
    country_name: string | null;
    country_code2: string | null;
    state_prov: string | null;
    zipcode: string | null;
  };
}

export function createIPGeolocationProvider(apiKey: string): GeoLocationProvider {
  return {
    name: "ipgeolocation",
    lookupIP: async (ip: string | null): Promise<GeoLocation> => {
      const emptyLocation: GeoLocation = { country: null, city: null };

      // Return empty if no IP provided
      if (!ip) {
        return emptyLocation;
      }

      try {
        // Make API request with 5 second timeout
        // Note: IP validation and private IP filtering is handled by parent
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(
          `https://api.ipgeolocation.io/v2/ipgeo?apiKey=${apiKey}&ip=${ip}&fields=location`,
          {
            signal: controller.signal,
          }
        );

        clearTimeout(timeoutId);

        // Handle non-OK responses
        if (!response.ok) {
          console.error(
            `Abstract API returned error: ${response.status} ${response.statusText}`
          );
          return emptyLocation;
        }

        const data = (await response.json()) as IPGeolocationResponse;

        return {
          country: data.location?.country_name || null,
          city: data.location?.city || null,
        };
      } catch (error) {
        // Log error and return empty on failure
        if ((error as Error).name === "AbortError") {
          console.error("IP Geolocation request timed out after 5 seconds");
        } else {
          console.error("Error looking up IP geolocation:", error);
        }
        return emptyLocation;
      }
    },
  };
}
