/**
 * Geolocation data structure
 * Represents the geographic location of an IP address
 */
export interface GeoLocation {
  country: string | null;
  city: string | null;
}

/**
 * Geolocation provider interface
 * All geolocation providers must implement this interface
 */
export interface GeoLocationProvider {
  name: string;
  lookupIP: (ip: string | null) => Promise<GeoLocation>;
}
