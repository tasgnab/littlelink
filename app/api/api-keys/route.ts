import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createApiKeySchema } from "@/lib/validations";
import { rateLimiters, applyRateLimit } from "@/lib/rate-limit";
import * as apiKeysService from "@/lib/services/api-keys";
import { requireWriteAuth } from "@/lib/api-auth";

// GET /api/api-keys - List all API keys
async function getHandler(request: NextRequest) {
  try {
    const auth = await requireWriteAuth(request);
    if (auth instanceof Response) return auth;

    const keys = await apiKeysService.listApiKeys(auth.userId);

    return NextResponse.json({ apiKeys: keys });
  } catch (error) {
    console.error("Error fetching API keys:", error);
    return NextResponse.json(
      { error: "Failed to fetch API keys" },
      { status: 500 }
    );
  }
}

// POST /api/api-keys - Create a new API key
async function postHandler(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = createApiKeySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { name } = validation.data;
    const newApiKey = await apiKeysService.createApiKey(session.user.id, name);

    // Return the key only once during creation
    return NextResponse.json({ apiKey: newApiKey }, { status: 201 });
  } catch (error) {
    console.error("Error creating API key:", error);
    return NextResponse.json(
      { error: "Failed to create API key" },
      { status: 500 }
    );
  }
}

// DELETE /api/api-keys?id=[id] - Delete an API key
async function deleteHandler(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "API key ID is required" },
        { status: 400 }
      );
    }

    const deleted = await apiKeysService.deleteApiKey(id, session.user.id);

    if (!deleted) {
      return NextResponse.json({ error: "API key not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting API key:", error);
    return NextResponse.json(
      { error: "Failed to delete API key" },
      { status: 500 }
    );
  }
}

// Export rate-limited handlers (using strict limiter for sensitive operations)
export async function GET(request: NextRequest) {
  return applyRateLimit(request, rateLimiters.strict, () => getHandler(request));
}

export async function POST(request: NextRequest) {
  return applyRateLimit(request, rateLimiters.strict, () => postHandler(request));
}

export async function DELETE(request: NextRequest) {
  return applyRateLimit(request, rateLimiters.strict, () => deleteHandler(request));
}
