import crypto from "crypto";
import { db } from "@/db";
import { apiKeys, users } from "@/db/schema";
import { eq } from "drizzle-orm";

const TOKEN_PREFIX = "ks_";
const TOKEN_RANDOM_BYTES = 32;

export function generateApiToken(): string {
  const random = crypto.randomBytes(TOKEN_RANDOM_BYTES).toString("base64url");
  return TOKEN_PREFIX + random;
}

export function hashApiToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function constantTimeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.byteLength !== bufB.byteLength) {
    const hashA = crypto.createHash("sha256").update(a).digest();
    const hashB = crypto.createHash("sha256").update(b).digest();
    return crypto.timingSafeEqual(hashA, hashB);
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

export interface ApiKeySession {
  user: {
    id: string;
    username: string;
    role: "USER" | "ADMIN";
  };
  apiKeyId: string;
}

export async function authenticateApiKey(authHeader: string): Promise<ApiKeySession | null> {
  if (!authHeader.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7).trim();
  if (!token || token.length < 20) return null;

  const tokenHash = hashApiToken(token);

  const key = await db.select({
    id: apiKeys.id,
    userId: apiKeys.userId,
    tokenHash: apiKeys.tokenHash,
    user: {
      id: users.id,
      username: users.username,
      role: users.role,
    },
  }).from(apiKeys)
    .innerJoin(users, eq(apiKeys.userId, users.id))
    .where(eq(apiKeys.tokenHash, tokenHash))
    .get();

  if (!key) return null;

  if (!constantTimeCompare(key.tokenHash, tokenHash)) return null;

  await db.update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, key.id));

  return {
    user: {
      id: key.user.id,
      username: key.user.username,
      role: key.user.role as "USER" | "ADMIN",
    },
    apiKeyId: key.id,
  };
}
