import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { links } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import QRCode from "qrcode";

// GET /api/links/[id]/qr - Generate QR code for a link
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const [link] = await db
      .select()
      .from(links)
      .where(and(eq(links.id, id), eq(links.userId, session.user.id)))
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
