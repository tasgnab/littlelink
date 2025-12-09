import type { GeoLocation, GeoLocationProvider } from "../types";

/**
 * Abstract API IP Geolocation Provider
 * Uses Abstract API's IP Intelligence API for IP geolocation lookups
 * Documentation: https://docs.abstractapi.com/ip-geolocation
 */

interface AbstractAPIResponse {
  ip_address: string;
  location: {
    city: string | null;
    country: string | null;
    country_code: string | null;
    region: string | null;
    postal_code: string | null;
  };
}

export function createAbstractAPIProvider(apiKey: string): GeoLocationProvider {
  return {
    name: "abstract-api",
    lookupIP: async (ip: string | null): Promise<GeoLocation> => {
      const emptyLocation: GeoLocation = { country: null, city: null };

      // Return empty if no IP provided
      if (!ip) {
        return emptyLocation;
      }

      try {
        // Extract first IP if multiple IPs in x-forwarded-for
        const firstIp = ip.split(",")[0].trim();

        // Handle localhost and private IPs
        // RFC 1918 private address ranges:
        // - 10.0.0.0 to 10.255.255.255 (Class A)
        // - 172.16.0.0 to 172.31.255.255 (Class B)
        // - 192.168.0.0 to 192.168.255.255 (Class C)
        if (firstIp === "127.0.0.1" || firstIp === "::1") {
          return { country: "Local", city: null };
        }

        if (firstIp.startsWith("10.") || firstIp.startsWith("192.168.")) {
          return { country: "Local", city: null };
        }

        // Check 172.16.0.0 to 172.31.255.255
        if (firstIp.startsWith("172.")) {
          const parts = firstIp.split(".");
          const secondOctet = parseInt(parts[1], 10);
          if (secondOctet >= 16 && secondOctet <= 31) {
            return { country: "Local", city: null };
          }
        }

        // Make API request with 5 second timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(
          `https://ip-intelligence.abstractapi.com/v1/?api_key=${apiKey}&ip_address=${firstIp}`,
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

        const data = (await response.json()) as AbstractAPIResponse;

        return {
          country: data.location?.country || null,
          city: data.location?.city || null,
        };
      } catch (error) {
        // Log error and return empty on failure
        if ((error as Error).name === "AbortError") {
          console.error("Abstract API request timed out after 5 seconds");
        } else {
          console.error("Error looking up IP geolocation:", error);
        }
        return emptyLocation;
      }
    },
  };
}
