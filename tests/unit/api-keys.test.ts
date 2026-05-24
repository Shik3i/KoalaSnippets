import { describe, it } from "node:test";
import assert from "node:assert";
import crypto from "node:crypto";

function generateApiToken(): string {
  const random = crypto.randomBytes(32).toString("base64url");
  return "ks_" + random;
}

function hashApiToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function extractTokenFromHeader(authHeader: string): string | null {
  if (!authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7).trim();
  if (!token || token.length < 20) return null;
  return token;
}

function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    const hashA = crypto.createHash("sha256").update(a).digest();
    const hashB = crypto.createHash("sha256").update(b).digest();
    return crypto.timingSafeEqual(hashA, hashB);
  }
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

describe("generateApiToken", () => {
  it("generates a token with ks_ prefix", () => {
    const token = generateApiToken();
    assert.ok(token.startsWith("ks_"));
  });

  it("generates tokens of consistent length", () => {
    const tokens = Array.from({ length: 10 }, () => generateApiToken());
    const lengths = new Set(tokens.map((t) => t.length));
    assert.strictEqual(lengths.size, 1, "All tokens should have same length");
  });

  it("generates unique tokens (100 generations)", () => {
    const tokens = new Set(Array.from({ length: 100 }, () => generateApiToken()));
    assert.strictEqual(tokens.size, 100, "All 100 tokens should be unique");
  });

  it("token length is at least 40 characters", () => {
    const token = generateApiToken();
    assert.ok(token.length >= 40);
  });
});

describe("hashApiToken", () => {
  it("produces a 64-character hex string (SHA-256)", () => {
    const hash = hashApiToken("test-token");
    assert.strictEqual(hash.length, 64);
    assert.ok(/^[0-9a-f]{64}$/.test(hash));
  });

  it("is deterministic — same input = same hash", () => {
    const a = hashApiToken("my-api-token-123");
    const b = hashApiToken("my-api-token-123");
    assert.strictEqual(a, b);
  });

  it("different inputs produce different hashes", () => {
    const a = hashApiToken("token-a");
    const b = hashApiToken("token-b");
    assert.notStrictEqual(a, b);
  });

  it("handles empty string", () => {
    const hash = hashApiToken("");
    assert.strictEqual(hash.length, 64);
  });

  it("handles very long tokens", () => {
    const longToken = "x".repeat(10000);
    const hash = hashApiToken(longToken);
    assert.strictEqual(hash.length, 64);
  });
});

describe("extractTokenFromHeader", () => {
  it("extracts valid Bearer token", () => {
    const token = extractTokenFromHeader("Bearer ks_abc123def456ghi789jkl");
    assert.strictEqual(token, "ks_abc123def456ghi789jkl");
  });

  it("returns null for missing Bearer prefix", () => {
    assert.strictEqual(extractTokenFromHeader("Basic abc123"), null);
    assert.strictEqual(extractTokenFromHeader("abc123"), null);
    assert.strictEqual(extractTokenFromHeader(""), null);
  });

  it("returns null for short tokens (< 20 chars)", () => {
    assert.strictEqual(extractTokenFromHeader("Bearer short"), null);
    assert.strictEqual(extractTokenFromHeader("Bearer 1234567890123456789"), null);
  });

  it("trims whitespace around token", () => {
    const token = extractTokenFromHeader("Bearer   ks_abc123def456ghi789jkl   ");
    assert.strictEqual(token, "ks_abc123def456ghi789jkl");
  });

  it("handles malformed headers gracefully", () => {
    assert.strictEqual(extractTokenFromHeader("Bearer"), null);
    assert.strictEqual(extractTokenFromHeader("Bearer "), null);
    assert.strictEqual(extractTokenFromHeader("bearer ks_token"), null);
    assert.strictEqual(extractTokenFromHeader("BEARER ks_token"), null);
  });
});

describe("constantTimeCompare", () => {
  it("returns true for identical strings", () => {
    assert.strictEqual(constantTimeCompare("hello", "hello"), true);
  });

  it("returns false for different strings (same length)", () => {
    assert.strictEqual(constantTimeCompare("hello", "world"), false);
  });

  it("returns false for different length strings", () => {
    assert.strictEqual(constantTimeCompare("short", "longer-string"), false);
  });

  it("handles empty strings", () => {
    assert.strictEqual(constantTimeCompare("", ""), true);
    assert.strictEqual(constantTimeCompare("", "a"), false);
  });

  it("handles hash-like long strings", () => {
    const hash1 = hashApiToken("token1");
    const hash2 = hashApiToken("token1");
    const hash3 = hashApiToken("token2");
    assert.strictEqual(constantTimeCompare(hash1, hash2), true);
    assert.strictEqual(constantTimeCompare(hash1, hash3), false);
  });
});
