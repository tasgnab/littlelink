import { handlers } from "@/lib/auth";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  console.log("[AUTH ROUTE] GET request:", {
    url: req.url,
    pathname: req.nextUrl.pathname,
    searchParams: Object.fromEntries(req.nextUrl.searchParams),
  });
  return handlers.GET(req);
}

export async function POST(req: NextRequest) {
  console.log("[AUTH ROUTE] POST request:", {
    url: req.url,
    pathname: req.nextUrl.pathname,
  });
  return handlers.POST(req);
}
