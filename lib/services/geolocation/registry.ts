import type { GeoLocationProvider } from "./types";

/**
 * Provider registry for geolocation services
 * Maintains a map of registered providers and allows retrieval by name
 */
const providers = new Map<string, GeoLocationProvider>();

/**
 * Register a geolocation provider
 * @param name - Unique identifier for the provider
 * @param provider - Provider implementation
 */
export function registerProvider(
  name: string,
  provider: GeoLocationProvider
): void {
  providers.set(name, provider);
}

/**
 * Get a registered geolocation provider by name
 * @param name - Provider name
 * @returns The provider implementation
 * @throws Error if provider is not registered
 */
export function getProvider(name: string): GeoLocationProvider {
  const provider = providers.get(name);
  if (!provider) {
    throw new Error(
      `Geolocation provider '${name}' not found. Available providers: ${Array.from(
        providers.keys()
      ).join(", ")}`
    );
  }
  return provider;
}
