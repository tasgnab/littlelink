import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiKeys } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export interface AuthResult {
  userId: string;
  isReadOnly: boolean;
}

/**
 * Authenticate a request using either session or API key
 * - Session auth: Full access (read + write)
 * - API key auth: Read-only access
 *
 * @param request - The incoming request
 * @returns AuthResult with userId and access level, or null if unauthorized
 */
export async function authenticateRequest(
  request: NextRequest
): Promise<AuthResult | null> {
  // First, try session authentication (full access)
  const session = await getServerSession(authOptions);
  if (session?.user?.id) {
    return {
      userId: session.user.id,
      isReadOnly: false,
    };
  }

  // If no session, try API key authentication (read-only)
  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return null;
  }

  // Support both "Bearer sk_xxx" and "sk_xxx" formats
  const apiKey = authHeader.startsWith("Bearer ")
    ? authHeader.substring(7)
    : authHeader;

  if (!apiKey || !apiKey.startsWith("sk_")) {
    return null;
  }

  try {
    // Look up the API key
    const [keyRecord] = await db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.key, apiKey))
      .limit(1);

    if (!keyRecord) {
      return null;
    }

    // Update last used timestamp (fire and forget)
    db.update(apiKeys)
      .set({ lastUsed: new Date() })
      .where(eq(apiKeys.id, keyRecord.id))
      .then()
      .catch((error) => {
        console.error("Error updating API key last used:", error);
      });

    return {
      userId: keyRecord.userId,
      isReadOnly: true,
    };
  } catch (error) {
    console.error("Error authenticating API key:", error);
    return null;
  }
}

/**
 * Helper to check if request is authenticated for read operations
 */
export async function requireReadAuth(
  request: NextRequest
): Promise<AuthResult | Response> {
  const auth = await authenticateRequest(request);
  if (!auth) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  return auth;
}

/**
 * Helper to check if request is authenticated for write operations
 * Only allows session auth (not API keys)
 */
export async function requireWriteAuth(
  request: NextRequest
): Promise<AuthResult | Response> {
  const auth = await authenticateRequest(request);

  if (!auth) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (auth.isReadOnly) {
    return Response.json(
      { error: "API keys have read-only access. Use session authentication for write operations." },
      { status: 403 }
    );
  }

  return auth;
}
