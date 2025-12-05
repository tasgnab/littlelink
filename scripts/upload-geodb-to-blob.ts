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

import https from "https";
import fs from "fs";
import path from "path";
import * as tar from "tar";
import { put } from "@vercel/blob";

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

// Configuration
const EDITION_ID = "GeoLite2-City";
const DOWNLOAD_URL = `https://download.maxmind.com/app/geoip_download?edition_id=${EDITION_ID}&license_key=${licenseKey}&suffix=tar.gz`;
const DATA_DIR = path.join(process.cwd(), "data");
const TEMP_FILE = path.join(DATA_DIR, "geolite2.tar.gz");
const DB_FILE = path.join(DATA_DIR, "GeoLite2-City.mmdb");
const BLOB_FILENAME = "GeoLite2-City.mmdb";

async function downloadDatabase(): Promise<void> {
  console.log("🌍 Downloading MaxMind GeoLite2-City database...");

  // Create data directory if it doesn't exist
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  // Download the database with redirect support
  return new Promise((resolve, reject) => {
    const downloadFromUrl = (url: string, redirectCount = 0) => {
      if (redirectCount > 5) {
        reject(new Error("Too many redirects"));
        return;
      }

      https
        .get(url, (response) => {
          if (response.statusCode === 401) {
            reject(
              new Error(
                "Invalid MaxMind license key. Please check your MAXMIND_LICENSE_KEY."
              )
            );
            return;
          }

          // Handle redirects
          if (response.statusCode === 301 || response.statusCode === 302) {
            const redirectUrl = response.headers.location;
            if (!redirectUrl) {
              reject(new Error("Redirect location not found"));
              return;
            }
            console.log(`Following redirect to: ${redirectUrl}`);
            downloadFromUrl(redirectUrl, redirectCount + 1);
            return;
          }

          if (response.statusCode !== 200) {
            reject(
              new Error(
                `Failed to download database. Status code: ${response.statusCode}`
              )
            );
            return;
          }

          const fileStream = fs.createWriteStream(TEMP_FILE);

          response.pipe(fileStream);

          fileStream.on("finish", () => {
            fileStream.close();
            console.log("✓ Database downloaded successfully");
            resolve();
          });

          fileStream.on("error", (err) => {
            if (fs.existsSync(TEMP_FILE)) {
              fs.unlinkSync(TEMP_FILE);
            }
            reject(err);
          });
        })
        .on("error", reject);
    };

    downloadFromUrl(DOWNLOAD_URL);
  });
}

async function extractDatabase(): Promise<void> {
  console.log("📦 Extracting database...");

  // Extract the tar.gz file and find the .mmdb file
  await tar.extract({
    file: TEMP_FILE,
    cwd: DATA_DIR,
    filter: (path: string) => path.endsWith(".mmdb"),
    strip: 1, // Remove the top-level directory from the archive
  });

  console.log("✓ Database extracted successfully");

  // Clean up temp file
  fs.unlinkSync(TEMP_FILE);
}

async function uploadToBlob(): Promise<void> {
  console.log("☁️  Uploading database to Vercel Blob...");

  // Read the database file
  const fileBuffer = fs.readFileSync(DB_FILE);
  const fileSize = (fileBuffer.length / 1024 / 1024).toFixed(2);

  console.log(`   File size: ${fileSize} MB`);

  // Upload to Vercel Blob
  const blob = await put(BLOB_FILENAME, fileBuffer, {
    access: "public",
    token: blobToken,
  });

  console.log("✓ Database uploaded successfully");
  console.log(`   URL: ${blob.url}`);

  // Clean up local file
  fs.unlinkSync(DB_FILE);
  console.log("✓ Cleaned up local files");
}

async function main() {
  try {
    console.log("");
    console.log("========================================");
    console.log("  Upload GeoLite2 to Vercel Blob");
    console.log("========================================");
    console.log("");

    await downloadDatabase();
    await extractDatabase();
    await uploadToBlob();

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
