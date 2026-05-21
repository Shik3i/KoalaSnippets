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
  const salt = crypto.randomBytes(16);
  const pepperedPassword = `${password}${pepper}${salt.toString("hex")}`;

  return hash(pepperedPassword, {
    type: 2,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 1,
    salt,
  });
}

export async function verifyPassword(password: string, hashStr: string): Promise<boolean> {
  const salt = extractSalt(hashStr);
  const pepperedPassword = `${password}${pepper}${salt}`;
  return verify(hashStr, pepperedPassword);
}

function extractSalt(hashStr: string): string {
  const params = hashStr.split("$");
  if (params.length < 5) {
    throw new Error("Invalid hash format");
  }
  const saltParam = params[4];
  if (!saltParam) {
    throw new Error("Invalid hash format: salt not found");
  }
  return Buffer.from(saltParam, "base64").toString("hex");
}

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function hashSessionToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function generateShareToken(): string {
  return crypto.randomBytes(24).toString("hex");
}

export function generateId(): string {
  return crypto.randomUUID();
}

