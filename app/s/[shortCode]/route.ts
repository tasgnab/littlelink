import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { links, clicks } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { parseUserAgent } from "@/lib/utils";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ shortCode: string }> }
) {
  try {
    const { shortCode } = await params;

    // Find the link
    const [link] = await db
      .select()
      .from(links)
      .where(eq(links.shortCode, shortCode))
      .limit(1);

    if (!link) {
      return new NextResponse(
        `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Link Not Found</title>
            <style>
              body {
                font-family: system-ui, -apple-system, sans-serif;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                margin: 0;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              }
              .container {
                text-align: center;
                background: white;
                padding: 3rem;
                border-radius: 1rem;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
              }
              h1 { color: #667eea; margin: 0 0 1rem 0; }
              p { color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>404 - Link Not Found</h1>
              <p>The short link you're looking for doesn't exist.</p>
            </div>
          </body>
        </html>
        `,
        {
          status: 404,
          headers: { "Content-Type": "text/html" },
        }
      );
    }

    // Check if link is active
    if (!link.isActive) {
      return new NextResponse(
        `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Link Inactive</title>
            <style>
              body {
                font-family: system-ui, -apple-system, sans-serif;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                margin: 0;
                background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
              }
              .container {
                text-align: center;
                background: white;
                padding: 3rem;
                border-radius: 1rem;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
              }
              h1 { color: #f5576c; margin: 0 0 1rem 0; }
              p { color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>Link Inactive</h1>
              <p>This link has been disabled by the owner.</p>
            </div>
          </body>
        </html>
        `,
        {
          status: 410,
          headers: { "Content-Type": "text/html" },
        }
      );
    }

    // Check if link has expired
    if (link.expiresAt && new Date() > link.expiresAt) {
      return new NextResponse(
        `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Link Expired</title>
            <style>
              body {
                font-family: system-ui, -apple-system, sans-serif;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                margin: 0;
                background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
              }
              .container {
                text-align: center;
                background: white;
                padding: 3rem;
                border-radius: 1rem;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
              }
              h1 { color: #fa709a; margin: 0 0 1rem 0; }
              p { color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>Link Expired</h1>
              <p>This link has expired and is no longer available.</p>
            </div>
          </body>
        </html>
        `,
        {
          status: 410,
          headers: { "Content-Type": "text/html" },
        }
      );
    }

    // Track the click asynchronously (fire and forget)
    const userAgent = req.headers.get("user-agent") || "";
    const referer = req.headers.get("referer") || null;
    const forwardedFor = req.headers.get("x-forwarded-for");
    const ipAddress = forwardedFor
      ? forwardedFor.split(",")[0].trim()
      : req.headers.get("x-real-ip") || "unknown";

    const { device, browser, os } = parseUserAgent(userAgent);

    // Track click in background
    db.insert(clicks)
      .values({
        linkId: link.id,
        referer,
        userAgent,
        ipAddress,
        device,
        browser,
        os,
      })
      .then(async () => {
        // Update click count
        await db
          .update(links)
          .set({ clicks: link.clicks + 1 })
          .where(eq(links.id, link.id));
      })
      .catch((error) => {
        console.error("Error tracking click:", error);
      });

    // Redirect to the original URL
    return NextResponse.redirect(link.originalUrl, { status: 302 });
  } catch (error) {
    console.error("Error handling redirect:", error);
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Error</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            .container {
              text-align: center;
              background: white;
              padding: 3rem;
              border-radius: 1rem;
              box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            }
            h1 { color: #667eea; margin: 0 0 1rem 0; }
            p { color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Oops!</h1>
            <p>Something went wrong. Please try again later.</p>
          </div>
        </body>
      </html>
      `,
      {
        status: 500,
        headers: { "Content-Type": "text/html" },
      }
    );
  }
}
