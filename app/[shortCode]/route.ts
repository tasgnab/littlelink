import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { links, clicks } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { parseUserAgent } from "@/lib/utils";

// GET /[shortCode] - Redirect to original URL
export async function GET(
  request: NextRequest,
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

    // Link not found
    if (!link) {
      return new NextResponse(
        `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>404 - Link Not Found</title>
            <style>
              body {
                margin: 0;
                padding: 0;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
              }
              .container {
                text-align: center;
                padding: 2rem;
              }
              h1 {
                font-size: 6rem;
                margin: 0;
                font-weight: bold;
              }
              h2 {
                font-size: 2rem;
                margin: 1rem 0;
                font-weight: 500;
              }
              p {
                font-size: 1.2rem;
                opacity: 0.9;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>404</h1>
              <h2>Link Not Found</h2>
              <p>The short link you're looking for doesn't exist.</p>
            </div>
          </body>
        </html>
        `,
        {
          status: 404,
          headers: {
            "Content-Type": "text/html",
          },
        }
      );
    }

    // Check if link is active
    if (!link.isActive) {
      return new NextResponse(
        `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>410 - Link Disabled</title>
            <style>
              body {
                margin: 0;
                padding: 0;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                color: white;
              }
              .container {
                text-align: center;
                padding: 2rem;
              }
              h1 {
                font-size: 6rem;
                margin: 0;
                font-weight: bold;
              }
              h2 {
                font-size: 2rem;
                margin: 1rem 0;
                font-weight: 500;
              }
              p {
                font-size: 1.2rem;
                opacity: 0.9;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>410</h1>
              <h2>Link Disabled</h2>
              <p>This short link has been disabled by its owner.</p>
            </div>
          </body>
        </html>
        `,
        {
          status: 410,
          headers: {
            "Content-Type": "text/html",
          },
        }
      );
    }

    // Check if link has expired
    if (link.expiresAt && link.expiresAt < new Date()) {
      return new NextResponse(
        `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>410 - Link Expired</title>
            <style>
              body {
                margin: 0;
                padding: 0;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                color: white;
              }
              .container {
                text-align: center;
                padding: 2rem;
              }
              h1 {
                font-size: 6rem;
                margin: 0;
                font-weight: bold;
              }
              h2 {
                font-size: 2rem;
                margin: 1rem 0;
                font-weight: 500;
              }
              p {
                font-size: 1.2rem;
                opacity: 0.9;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>410</h1>
              <h2>Link Expired</h2>
              <p>This short link has expired and is no longer available.</p>
            </div>
          </body>
        </html>
        `,
        {
          status: 410,
          headers: {
            "Content-Type": "text/html",
          },
        }
      );
    }

    // Track the click asynchronously (fire-and-forget)
    const userAgent = request.headers.get("user-agent") || "";
    const referer = request.headers.get("referer") || null;
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || null;

    const { device, browser, os } = parseUserAgent(userAgent);

    // Don't await this - fire and forget
    db.insert(clicks)
      .values({
        linkId: link.id,
        referer,
        userAgent,
        ip,
        device,
        browser,
        os,
      })
      .then(() => {
        // Also increment the click counter on the link
        return db
          .update(links)
          .set({ clicks: link.clicks + 1 })
          .where(eq(links.id, link.id));
      })
      .catch((error) => {
        console.error("Error tracking click:", error);
      });

    // Redirect to the original URL
    return NextResponse.redirect(link.originalUrl, 302);
  } catch (error) {
    console.error("Error in redirect handler:", error);
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>500 - Server Error</title>
          <style>
            body {
              margin: 0;
              padding: 0;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
              color: white;
            }
            .container {
              text-align: center;
              padding: 2rem;
            }
            h1 {
              font-size: 6rem;
              margin: 0;
              font-weight: bold;
            }
            h2 {
              font-size: 2rem;
              margin: 1rem 0;
              font-weight: 500;
            }
            p {
              font-size: 1.2rem;
              opacity: 0.9;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>500</h1>
            <h2>Server Error</h2>
            <p>Something went wrong. Please try again later.</p>
          </div>
        </body>
      </html>
      `,
      {
        status: 500,
        headers: {
          "Content-Type": "text/html",
        },
      }
    );
  }
}
