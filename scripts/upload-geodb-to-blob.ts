/**
 * Upload MaxMind GeoLite2 City database to Vercel Blob
 *
 * This script downloads the GeoLite2-City database from MaxMind
 * and uploads it to Vercel Blob storage for serverless deployments.
 *
 * Prerequisites:
 * 1. MAXMIND_LICENSE_KEY environment variable (get from maxmind.com)
 * 2. BLOB_READ_WRITE_TOKEN environment variable (get from Vercel dashboard)
 */

import { downloadGeoLite2Database, extractGeoLite2Database, uploadGeoLite2ToBlob } from "../lib/services/maxmind";

// Get tokens from environment
const licenseKey = process.env.MAXMIND_LICENSE_KEY;
const blobToken = process.env.BLOB_READ_WRITE_TOKEN;

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

if (!blobToken) {
  console.error("❌ Error: BLOB_READ_WRITE_TOKEN environment variable is not set.");
  console.error("");
  console.error("To get a Blob token:");
  console.error("1. Go to your Vercel dashboard");
  console.error("2. Navigate to Storage → Create Database → Blob");
  console.error("3. Copy the BLOB_READ_WRITE_TOKEN");
  console.error("4. Add it to your .env file:");
  console.error("   BLOB_READ_WRITE_TOKEN=your_token_here");
  console.error("");
  process.exit(1);
}

async function main() {
  try {
    console.log("");
    console.log("========================================");
    console.log("  Upload GeoLite2 to Vercel Blob");
    console.log("========================================");
    console.log("");
    
    if (!licenseKey) {
      throw new Error("MAXMIND_LICENSE_KEY is not set.");
    }

    if (!blobToken) {
      throw new Error("BLOB_READ_WRITE_TOKEN is not set.");
    }
    
    // Download the database
    console.log("🌍 Downloading MaxMind GeoLite2-City database...");
    const tarGzBuffer = await downloadGeoLite2Database(licenseKey);
    console.log(`✓ Database downloaded successfully (${(tarGzBuffer.length / 1024 / 1024).toFixed(2)} MB)`);

    // Extract the database
    console.log("📦 Extracting database...");
    const dbBuffer = await extractGeoLite2Database(tarGzBuffer);
    console.log(`✓ Database extracted successfully (${(dbBuffer.length / 1024 / 1024).toFixed(2)} MB)`);

    // Upload to Vercel Blob
    console.log("☁️  Uploading database to Vercel Blob...");
    const fileSize = (dbBuffer.length / 1024 / 1024).toFixed(2);
    console.log(`   File size: ${fileSize} MB`);

    await uploadGeoLite2ToBlob(dbBuffer, blobToken);

    console.log("");
    console.log("✅ Success! GeoLite2 database is now on Vercel Blob.");
    console.log("");
    console.log("💡 Next steps:");
    console.log("   1. Set MAXMIND_STORAGE_MODE=blob in your Vercel environment variables");
    console.log("   2. Deploy your app to Vercel");
    console.log("   3. Consider setting up a weekly cron job to run this script");
    console.log("");
  } catch (error) {
    console.error("");
    console.error("❌ Error:", error instanceof Error ? error.message : error);
    console.error("");
    process.exit(1);
  }
}

main();
