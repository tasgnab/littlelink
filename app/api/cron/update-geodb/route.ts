import { NextRequest, NextResponse } from "next/server";
import https from "https";
import * as tar from "tar";
import { put, del, list } from "@vercel/blob";
import { config } from "@/lib/config";
import os from "os";
import path from "path";
import fs from "fs";

// This endpoint is called by Vercel Cron to update the GeoLite2 database weekly
export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes timeout

async function downloadDatabase(licenseKey: string): Promise<Buffer> {
  const EDITION_ID = "GeoLite2-City";
  const DOWNLOAD_URL = `https://download.maxmind.com/app/geoip_download?edition_id=${EDITION_ID}&license_key=${licenseKey}&suffix=tar.gz`;

  console.log("🌍 Downloading MaxMind GeoLite2-City database...");

  return new Promise((resolve, reject) => {
    const downloadFromUrl = (url: string, redirectCount = 0) => {
      if (redirectCount > 5) {
        reject(new Error("Too many redirects"));
        return;
      }

      https
        .get(url, (response) => {
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

          if (response.statusCode !== 200) {
            reject(new Error(`Failed to download database. Status code: ${response.statusCode}`));
            return;
          }

          const chunks: Buffer[] = [];

          response.on("data", (chunk) => {
            chunks.push(chunk);
          });

          response.on("end", () => {
            const buffer = Buffer.concat(chunks);
            console.log(`✓ Database downloaded successfully (${(buffer.length / 1024 / 1024).toFixed(2)} MB)`);
            resolve(buffer);
          });

          response.on("error", reject);
        })
        .on("error", reject);
    };

    downloadFromUrl(DOWNLOAD_URL);
  });
}

async function extractDatabase(tarGzBuffer: Buffer): Promise<Buffer> {
  console.log("📦 Extracting database...");

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

    console.log(`✓ Database extracted successfully (${(mmdbBuffer.length / 1024 / 1024).toFixed(2)} MB)`);

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

async function uploadToBlob(dbBuffer: Buffer, blobToken: string): Promise<string> {
  console.log("☁️  Uploading database to Vercel Blob...");

  // Delete old database if it exists
  try {
    const { blobs } = await list({ token: blobToken });
    const oldBlob = blobs.find((b) => b.pathname === "GeoLite2-City.mmdb");
    if (oldBlob) {
      await del(oldBlob.url, { token: blobToken });
      console.log("✓ Deleted old database");
    }
  } catch (err) {
    console.error("Warning: Failed to delete old database:", err);
  }

  // Upload new database
  const blob = await put("GeoLite2-City.mmdb", dbBuffer, {
    access: "public",
    token: blobToken,
  });

  console.log("✓ Database uploaded successfully");
  console.log(`   URL: ${blob.url}`);

  return blob.url;
}

export async function GET(request: NextRequest) {
  try {
    // Verify the request is from Vercel Cron
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error("CRON_SECRET not set");
      return NextResponse.json(
        { error: "Cron secret not configured" },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      console.error("Invalid cron secret");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const licenseKey = config.maxmind.licenseKey;
    const blobToken = config.maxmind.blobToken;

    if (!licenseKey) {
      return NextResponse.json(
        { error: "MaxMind license key not configured" },
        { status: 500 }
      );
    }

    if (!blobToken) {
      return NextResponse.json(
        { error: "Vercel Blob token not configured" },
        { status: 500 }
      );
    }

    console.log("");
    console.log("========================================");
    console.log("  Vercel Cron: Update GeoLite2 Database");
    console.log("========================================");
    console.log("");

    // Download the database
    const tarGzBuffer = await downloadDatabase(licenseKey);

    // Extract the .mmdb file
    const dbBuffer = await extractDatabase(tarGzBuffer);

    // Upload to Vercel Blob
    const blobUrl = await uploadToBlob(dbBuffer, blobToken);

    console.log("");
    console.log("✅ Success! GeoLite2 database updated.");
    console.log("");

    return NextResponse.json({
      success: true,
      message: "GeoLite2 database updated successfully",
      blobUrl,
      size: `${(dbBuffer.length / 1024 / 1024).toFixed(2)} MB`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("");
    console.error("❌ Error updating GeoLite2 database:");
    console.error(error);
    console.error("");

    return NextResponse.json(
      {
        error: "Failed to update GeoLite2 database",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
