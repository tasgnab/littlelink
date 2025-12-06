import { NextRequest, NextResponse } from "next/server";
import { config } from "@/lib/config";
import { downloadGeoLite2Database, extractGeoLite2Database, uploadGeoLite2ToBlob } from "@/lib/services/maxmind";

// This endpoint is called by Vercel Cron to update the GeoLite2 database weekly
export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes timeout

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
    console.log("🌍 Downloading MaxMind GeoLite2-City database...");
    const tarGzBuffer = await downloadGeoLite2Database(licenseKey);
    console.log(`✓ Database downloaded successfully (${(tarGzBuffer.length / 1024 / 1024).toFixed(2)} MB)`);

    // Extract the .mmdb file
    console.log("📦 Extracting database...");
    const dbBuffer = await extractGeoLite2Database(tarGzBuffer);
    console.log(`✓ Database extracted successfully (${(dbBuffer.length / 1024 / 1024).toFixed(2)} MB)`);

    // Upload to Vercel Blob
    console.log("☁️  Uploading database to Vercel Blob...");
    const blobUrl = await uploadGeoLite2ToBlob(dbBuffer, blobToken);

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
