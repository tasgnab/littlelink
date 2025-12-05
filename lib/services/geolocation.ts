import { Reader, ReaderModel } from "@maxmind/geoip2-node";
import { config } from "@/lib/config";
import fs from "fs";
import path from "path";
import os from "os";

let reader: ReaderModel | null = null;
let initializationPromise: Promise<void> | null = null;

export interface GeoLocation {
  country: string | null;
  city: string | null;
}

/**
 * Initialize the MaxMind GeoIP2 reader from Vercel Blob
 * Downloads the database to a temporary file and opens it
 */
async function initializeFromBlob(): Promise<void> {
  const blobToken = config.maxmind.blobToken;

  if (!blobToken) {
    console.error("❌ BLOB_READ_WRITE_TOKEN not set!");
    console.error("   Geolocation will be disabled.");
    console.error("   Set BLOB_READ_WRITE_TOKEN environment variable or change MAXMIND_STORAGE_MODE to 'local'");
    return;
  }

  try {
    // Import Vercel Blob SDK
    const { list } = await import("@vercel/blob");

    console.log("🔍 Looking for GeoLite2 database in Vercel Blob...");

    // List all blobs and find our database
    const { blobs } = await list({
      token: blobToken,
    });

    const geoDbBlob = blobs.find((blob) => blob.pathname === "GeoLite2-City.mmdb");

    if (!geoDbBlob) {
      console.error("❌ GeoLite2 database not found in Vercel Blob!");
      console.error("   Run 'npm run upload-geodb-to-blob' to upload it.");
      return;
    }

    console.log(`✓ Found database at: ${geoDbBlob.url}`);
    console.log("⬇️  Downloading GeoLite2 database from Vercel Blob...");

    // Download database to temp file
    const response = await fetch(geoDbBlob.url);

    if (!response.ok) {
      throw new Error(`Failed to download from blob: ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    const tempDir = os.tmpdir();
    const tempPath = path.join(tempDir, "GeoLite2-City.mmdb");

    console.log(`💾 Saving to: ${tempPath}`);

    // Write to temp file
    fs.writeFileSync(tempPath, Buffer.from(buffer));

    // Open the database
    reader = await Reader.open(tempPath);

    console.log(`✅ MaxMind GeoIP2 database loaded successfully from Vercel Blob (${(buffer.byteLength / 1024 / 1024).toFixed(2)} MB)`);
  } catch (error) {
    console.error("❌ Failed to initialize MaxMind GeoIP2 from Vercel Blob:");
    console.error(error);
    reader = null;
  }
}

/**
 * Initialize the MaxMind GeoIP2 reader from local file
 */
async function initializeFromLocal(): Promise<void> {
  try {
    const dbPath = config.maxmind.databasePath;

    console.log(`🔍 Looking for GeoLite2 database at: ${dbPath}`);

    // Check if database file exists
    if (!fs.existsSync(dbPath)) {
      console.error(`❌ MaxMind database not found at ${dbPath}`);
      console.error("   Geolocation will be disabled.");
      console.error("   Run 'npm run download-geodb' to download the database.");
      return;
    }

    reader = await Reader.open(dbPath);
    console.log("✅ MaxMind GeoIP2 database loaded successfully from local file");
  } catch (error) {
    console.error("❌ Failed to initialize MaxMind GeoIP2 from local file:");
    console.error(error);
    reader = null;
  }
}

/**
 * Initialize the MaxMind GeoIP2 reader
 * This should be called once when the app starts
 * Safe to call multiple times - will only initialize once
 */
export async function initializeGeoIP(): Promise<void> {
  // If already initialized, return
  if (reader !== null) {
    return;
  }

  // If initialization is in progress, wait for it
  if (initializationPromise !== null) {
    return initializationPromise;
  }

  // Start initialization
  initializationPromise = (async () => {
    const storageMode = config.maxmind.storageMode;

    console.log("===========================================");
    console.log("GeoIP Initialization Starting");
    console.log(`Storage mode: ${storageMode}`);
    console.log(`Has blob token: ${!!config.maxmind.blobToken}`);
    console.log(`Has license key: ${!!config.maxmind.licenseKey}`);
    console.log("===========================================");

    if (storageMode === "blob") {
      await initializeFromBlob();
    } else {
      await initializeFromLocal();
    }

    console.log(`GeoIP initialization complete. Reader initialized: ${reader !== null}`);
  })();

  await initializationPromise;
}

/**
 * Lookup geolocation for an IP address
 * Initializes the reader on first use if not already initialized
 * Returns null if the database is not initialized or if lookup fails
 */
export async function lookupIP(ip: string | null): Promise<GeoLocation> {
  const emptyLocation: GeoLocation = { country: null, city: null };

  // Return empty if no IP provided
  if (!ip) {
    return emptyLocation;
  }

  // Lazy initialization - initialize if not already done
  if (!reader) {
    console.log("GeoIP reader not initialized, attempting lazy initialization...");
    await initializeGeoIP();
  }

  // Return empty if reader still not initialized after initialization attempt
  if (!reader) {
    console.warn("GeoIP reader could not be initialized. Geolocation will not be available.");
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

    // Lookup the IP
    const response = reader.city(firstIp);

    return {
      country: response.country?.names?.en || response.country?.isoCode || null,
      city: response.city?.names?.en || null,
    };
  } catch (error) {
    // IP not found in database or invalid IP - return empty
    return emptyLocation;
  }
}

/**
 * Check if GeoIP is available
 */
export function isGeoIPAvailable(): boolean {
  return reader !== null;
}

/**
 * Close the reader (cleanup)
 */
export function closeGeoIP(): void {
  if (reader) {
    // The @maxmind/geoip2-node Reader doesn't have a close method
    // but we can null it out to allow garbage collection
    reader = null;
  }
}
