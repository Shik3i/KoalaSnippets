import { hash, verify } from "argon2";
import crypto from "crypto";

const PEPPER = process.env.AUTH_PEPPER;

if (!PEPPER) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_PEPPER environment variable is required in production. Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"");
  }
  console.warn("[auth] AUTH_PEPPER not set. Using development-only fallback pepper.");
}

const pepper = PEPPER ?? "dev-pepper-not-for-production";

export async function hashPassword(password: string): Promise<string> {
  const pepperedPassword = `${password}${pepper}`;

  return hash(pepperedPassword, {
    type: 2,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 1,
  });
}

export async function verifyPassword(password: string, hashStr: string): Promise<boolean> {
  const pepperedPassword = `${password}${pepper}`;
  return verify(hashStr, pepperedPassword);
}

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

function getSessionSecret(): Buffer {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET environment variable is required");
  }
  return Buffer.from(secret, "hex");
}

export function hashSessionToken(token: string): string {
  return crypto.createHmac("sha256", getSessionSecret()).update(token).digest("hex");
}

export function generateShareToken(): string {
  return crypto.randomBytes(24).toString("hex");
}

export function generateId(): string {
  return crypto.randomUUID();
}

