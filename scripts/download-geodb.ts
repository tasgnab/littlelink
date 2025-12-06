/**
 * Download MaxMind GeoLite2 City database
 *
 * This script downloads the GeoLite2-City database from MaxMind.
 * Requires a free MaxMind license key.
 *
 * Get your license key:
 * 1. Sign up at https://www.maxmind.com/en/geolite2/signup
 * 2. Generate a license key
 * 3. Add it to your .env file as MAXMIND_LICENSE_KEY
 */

import fs from "fs";
import path from "path";
import { downloadGeoLite2Database, extractGeoLite2Database } from "../lib/services/maxmind";

// Get license key from environment
const licenseKey = process.env.MAXMIND_LICENSE_KEY;

if (!licenseKey) {
  console.error("❌ Error: MAXMIND_LICENSE_KEY environment variable is not set.");
  console.error("");
  console.error("To get a free license key:");
  console.error("1. Sign up at https://www.maxmind.com/en/geolite2/signup");
  console.error("2. Generate a license key in your account");
  console.error("3. Add it to your .env file:");
  console.error("   MAXMIND_LICENSE_KEY=your_license_key_here");
  console.error("");
  process.exit(1);
}

// Configuration
const DATA_DIR = path.join(process.cwd(), "data");
const TARGET_FILE = path.join(DATA_DIR, "GeoLite2-City.mmdb");

async function main() {
  try {
    console.log("");
    console.log("========================================");
    console.log("  MaxMind GeoLite2 Database Download");
    console.log("========================================");
    console.log("");

    if (!licenseKey) {
      throw new Error("MAXMIND_LICENSE_KEY is not set.");
    }

    // Create data directory if it doesn't exist
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
      console.log(`✓ Created directory: ${DATA_DIR}`);
    }

    // Download the database
    console.log("🌍 Downloading MaxMind GeoLite2-City database...");
    const tarGzBuffer = await downloadGeoLite2Database(licenseKey);
    console.log(`✓ Database downloaded successfully (${(tarGzBuffer.length / 1024 / 1024).toFixed(2)} MB)`);

    // Extract the database
    console.log("📦 Extracting database...");
    const dbBuffer = await extractGeoLite2Database(tarGzBuffer);
    console.log(`✓ Database extracted successfully (${(dbBuffer.length / 1024 / 1024).toFixed(2)} MB)`);

    // Write to target file
    fs.writeFileSync(TARGET_FILE, dbBuffer);
    console.log("✓ Saved to disk");

    console.log("");
    console.log("✅ Success! GeoLite2 database is ready.");
    console.log(`   Location: ${TARGET_FILE}`);
    console.log("");
    console.log("💡 The database should be updated regularly.");
    console.log("   Consider setting up a cron job or scheduled task to run this script weekly.");
    console.log("");
  } catch (error) {
    console.error("");
    console.error("❌ Error:", error instanceof Error ? error.message : error);
    console.error("");
    process.exit(1);
  }
}

main();
