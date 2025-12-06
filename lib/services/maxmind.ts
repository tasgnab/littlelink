/**
 * MaxMind GeoLite2 Database Download Utility
 *
 * Provides reusable functions for downloading, extracting, and uploading
 * the MaxMind GeoLite2 database.
 */

import https from "https";
import * as tar from "tar";
import os from "os";
import path from "path";
import fs from "fs";

/**
 * Download MaxMind GeoLite2 database from MaxMind's CDN
 *
 * @param licenseKey - MaxMind license key
 * @param editionId - Database edition (default: "GeoLite2-City")
 * @returns Buffer containing the tar.gz file
 */
export async function downloadGeoLite2Database(
  licenseKey: string,
  editionId: string = "GeoLite2-City"
): Promise<Buffer> {
  const DOWNLOAD_URL = `https://download.maxmind.com/app/geoip_download?edition_id=${editionId}&license_key=${licenseKey}&suffix=tar.gz`;

  return new Promise((resolve, reject) => {
    const downloadFromUrl = (url: string, redirectCount = 0) => {
      if (redirectCount > 5) {
        reject(new Error("Too many redirects"));
        return;
      }

      https
        .get(url, (response) => {
          // Handle authentication errors
          if (response.statusCode === 401) {
            reject(new Error("Invalid MaxMind license key"));
            return;
          }

          // Handle redirects
          if (response.statusCode === 301 || response.statusCode === 302) {
            const redirectUrl = response.headers.location;
            if (!redirectUrl) {
              reject(new Error("Redirect location not found"));
              return;
            }
            console.log(`Following redirect...`);
            downloadFromUrl(redirectUrl, redirectCount + 1);
            return;
          }

          // Handle non-200 responses
          if (response.statusCode !== 200) {
            reject(new Error(`Failed to download database. Status code: ${response.statusCode}`));
            return;
          }

          // Collect response data
          const chunks: Buffer[] = [];

          response.on("data", (chunk) => {
            chunks.push(chunk);
          });

          response.on("end", () => {
            const buffer = Buffer.concat(chunks);
            resolve(buffer);
          });

          response.on("error", reject);
        })
        .on("error", reject);
    };

    downloadFromUrl(DOWNLOAD_URL);
  });
}

/**
 * Extract MaxMind GeoLite2 database from tar.gz buffer
 *
 * @param tarGzBuffer - Buffer containing the tar.gz file
 * @returns Buffer containing the extracted .mmdb file
 */
export async function extractGeoLite2Database(tarGzBuffer: Buffer): Promise<Buffer> {
  const tempDir = os.tmpdir();
  const tempTarFile = path.join(tempDir, `geolite2-${Date.now()}.tar.gz`);
  const tempExtractDir = path.join(tempDir, `geolite2-extract-${Date.now()}`);

  try {
    // Write tar.gz to temp file
    fs.writeFileSync(tempTarFile, tarGzBuffer);

    // Create extraction directory
    fs.mkdirSync(tempExtractDir, { recursive: true });

    // Extract the tar.gz file
    await tar.extract({
      file: tempTarFile,
      cwd: tempExtractDir,
      filter: (path: string) => path.endsWith(".mmdb"),
      strip: 1,
    });

    // Find the .mmdb file
    const files = fs.readdirSync(tempExtractDir);
    const mmdbFile = files.find((f) => f.endsWith(".mmdb"));

    if (!mmdbFile) {
      throw new Error("No .mmdb file found in archive");
    }

    const mmdbPath = path.join(tempExtractDir, mmdbFile);
    const mmdbBuffer = fs.readFileSync(mmdbPath);

    return mmdbBuffer;
  } finally {
    // Cleanup temp files
    try {
      if (fs.existsSync(tempTarFile)) fs.unlinkSync(tempTarFile);
      if (fs.existsSync(tempExtractDir)) fs.rmSync(tempExtractDir, { recursive: true });
    } catch (err) {
      console.error("Warning: Failed to cleanup temp files:", err);
    }
  }
}

/**
 * Upload MaxMind GeoLite2 database to Vercel Blob
 *
 * @param dbBuffer - Buffer containing the .mmdb file
 * @param blobToken - Vercel Blob storage token
 * @returns URL of the uploaded blob
 */
export async function uploadGeoLite2ToBlob(dbBuffer: Buffer, blobToken: string): Promise<string> {
  const { put, del, list } = await import("@vercel/blob");
  const BLOB_FILENAME = "GeoLite2-City.mmdb";

  // Delete old database if it exists
  try {
    const { blobs } = await list({ token: blobToken });
    const oldBlob = blobs.find((b) => b.pathname === BLOB_FILENAME);
    if (oldBlob) {
      await del(oldBlob.url, { token: blobToken });
      console.log("✓ Deleted old database");
    }
  } catch (err) {
    console.error("Warning: Failed to delete old database:", err);
  }

  // Upload new database
  const blob = await put(BLOB_FILENAME, dbBuffer, {
    access: "public",
    token: blobToken,
  });

  console.log("✓ Database uploaded successfully");
  console.log(`   URL: ${blob.url}`);

  return blob.url;
}
