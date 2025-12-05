import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { links } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import QRCode from "qrcode";
import { requireReadAuth } from "@/lib/api-auth";
import { rateLimiters, applyRateLimit } from "@/lib/rate-limit";

// GET /api/links/[id]/qr - Generate QR code for a link
// Supports both session and API key authentication (read-only)
async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireReadAuth(request);
    if (auth instanceof Response) return auth;

    const { id } = await params;

    const [link] = await db
      .select()
      .from(links)
      .where(and(eq(links.id, id), eq(links.userId, auth.userId)))
      .limit(1);

    if (!link) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const shortUrl = `${appUrl}/${link.shortCode}`;

    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(shortUrl, {
      width: 300,
      margin: 2,
    });

    return NextResponse.json({ qrCode: qrCodeDataUrl });
  } catch (error) {
    console.error("Error generating QR code:", error);
    return NextResponse.json(
      { error: "Failed to generate QR code" },
      { status: 500 }
    );
  }
}

// Export rate-limited handler
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return applyRateLimit(request, rateLimiters.api, () => getHandler(request, context));
}
