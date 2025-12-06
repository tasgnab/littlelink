import { NextRequest, NextResponse } from "next/server";
import { rateLimiters, getClientIdentifier } from "@/lib/rate-limit";
import * as linksService from "@/lib/services/links";
import * as analyticsService from "@/lib/services/analytics";

// Force Node.js runtime for geolocation support
export const runtime = "nodejs";

// GET /[shortCode] - Redirect to original URL
async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ shortCode: string }> }
) {
  try {
    const { shortCode } = await params;
    const searchParams = request.nextUrl.searchParams;

    // Find the link
    const link = await linksService.getLinkByShortCode(shortCode);

    // Link not found
    if (!link) {
      // Track orphaned visit asynchronously (fire-and-forget)
      analyticsService.trackOrphanedVisit(request, shortCode + (searchParams.toString() ? `?${searchParams.toString()}` : ''));

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
    analyticsService.trackVisit(request, link);

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

// Export rate-limited handler with custom error page for rate limiting
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ shortCode: string }> }
) {
  const identifier = getClientIdentifier(request);
  const result = rateLimiters.redirect.check(identifier);

  if (!result.success) {
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>429 - Too Many Requests</title>
          <style>
            body {
              margin: 0;
              padding: 0;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              background: linear-gradient(135deg, #fc5c7d 0%, #6a82fb 100%);
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
            <h1>429</h1>
            <h2>Too Many Requests</h2>
            <p>You've made too many requests. Please try again in a moment.</p>
          </div>
        </body>
      </html>
      `,
      {
        status: 429,
        headers: {
          "Content-Type": "text/html",
          "X-RateLimit-Limit": "300",
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": result.reset.toString(),
          "Retry-After": Math.ceil((result.reset - Date.now()) / 1000).toString(),
        },
      }
    );
  }

  const response = await getHandler(request, context);
  const headers = new Headers(response.headers);
  headers.set("X-RateLimit-Limit", "300");
  headers.set("X-RateLimit-Remaining", result.remaining.toString());
  headers.set("X-RateLimit-Reset", result.reset.toString());

  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
