import { hash, verify } from "argon2";
import crypto from "crypto";

const PEPPER = process.env.AUTH_PEPPER;

if (!PEPPER && process.env.NODE_ENV === "production") {
  console.warn("AUTH_PEPPER environment variable is not set. Using default (INSECURE)");
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
  const saltParam = params.find((p) => p.startsWith("s="));
  if (!saltParam) {
    throw new Error("Invalid hash format: salt not found");
  }
  return Buffer.from(saltParam.split("=")[1], "base64").toString("hex");
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
