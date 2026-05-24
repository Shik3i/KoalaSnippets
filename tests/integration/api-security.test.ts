import { describe, it } from "node:test";
import assert from "node:assert";
import crypto from "node:crypto";

function escapeLike(value: string): string {
  return value.replace(/[%_]/g, "\\$&");
}

function getSafePage(raw: string | null, defaultVal = 1): number {
  if (!raw) return defaultVal;
  const parsed = parseInt(raw, 10);
  if (isNaN(parsed) || parsed < 1) return defaultVal;
  if (parsed > 1000) return 1000;
  return parsed;
}

function generateSessionToken(): string {
  return crypto.randomBytes(48).toString("base64url");
}

function hashSessionToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function constantTimeShareCompare(a: string, b: string): boolean {
  const hashA = crypto.createHash("sha256").update(a).digest();
  const hashB = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

describe("escapeLike", () => {
  it("escapes % wildcard", () => {
    assert.strictEqual(escapeLike("100%"), "100\\%");
  });
  it("escapes _ wildcard", () => {
    assert.strictEqual(escapeLike("test_value"), "test\\_value");
  });
  it("escapes both wildcards", () => {
    assert.strictEqual(escapeLike("100%_test"), "100\\%\\_test");
  });
  it("returns unchanged for normal strings", () => {
    assert.strictEqual(escapeLike("normal-string"), "normal-string");
    assert.strictEqual(escapeLike("hello world 123"), "hello world 123");
  });
  it("handles empty string", () => {
    assert.strictEqual(escapeLike(""), "");
  });
});

describe("getSafePage", () => {
  it("returns 1 for null/undefined", () => {
    assert.strictEqual(getSafePage(null), 1);
    assert.strictEqual(getSafePage(""), 1);
  });
  it("returns parsed number for valid input", () => {
    assert.strictEqual(getSafePage("5"), 5);
    assert.strictEqual(getSafePage("1"), 1);
    assert.strictEqual(getSafePage("50"), 50);
  });
  it("returns 1 for non-numeric input", () => {
    assert.strictEqual(getSafePage("abc"), 1);
    assert.strictEqual(getSafePage("page-5"), 1);
  });
  it("returns 1 for zero or negative", () => {
    assert.strictEqual(getSafePage("0"), 1);
    assert.strictEqual(getSafePage("-1"), 1);
    assert.strictEqual(getSafePage("-100"), 1);
  });
  it("caps at 1000", () => {
    assert.strictEqual(getSafePage("1000"), 1000);
    assert.strictEqual(getSafePage("1001"), 1000);
    assert.strictEqual(getSafePage("9999"), 1000);
  });
  it("respects custom default value", () => {
    assert.strictEqual(getSafePage(null, 10), 10);
    assert.strictEqual(getSafePage("abc", 10), 10);
  });
});

describe("Session Token Generation & Hashing", () => {
  it("generateSessionToken produces unique tokens", () => {
    const tokens = new Set(Array.from({ length: 50 }, () => generateSessionToken()));
    assert.strictEqual(tokens.size, 50);
  });
  it("hashSessionToken is deterministic", () => {
    const h1 = hashSessionToken("token-abc");
    const h2 = hashSessionToken("token-abc");
    assert.strictEqual(h1, h2);
  });
  it("hashSessionToken produces 64-char hex", () => {
    const hash = hashSessionToken("test");
    assert.strictEqual(hash.length, 64);
    assert.ok(/^[a-f0-9]{64}$/.test(hash));
  });
});

describe("constantTimeShareCompare", () => {
  it("returns true for identical tokens", () => {
    assert.strictEqual(constantTimeShareCompare("token-abc", "token-abc"), true);
  });
  it("returns false for different tokens", () => {
    assert.strictEqual(constantTimeShareCompare("token-abc", "token-xyz"), false);
  });
  it("returns false for similar but not identical", () => {
    assert.strictEqual(constantTimeShareCompare("token-abc", "token-abc1"), false);
  });
  it("handles empty strings", () => {
    assert.strictEqual(constantTimeShareCompare("", ""), true);
    assert.strictEqual(constantTimeShareCompare("a", ""), false);
  });
});

describe("Fork Validation Logic", () => {
  function validateFork(params: {
    snippetExists: boolean;
    isOwnSnippet: boolean;
    visibility: string;
    hasPassword: boolean;
    hasFiles: boolean;
  }): { allowed: boolean; error?: string } {
    if (!params.snippetExists) return { allowed: false, error: "Snippet not found" };
    if (params.isOwnSnippet) return { allowed: false, error: "Cannot fork your own snippet" };
    if (params.visibility !== "PUBLIC" && params.visibility !== "SHARED") {
      return { allowed: false, error: "This snippet is not forkable" };
    }
    if (params.hasPassword) return { allowed: false, error: "Password-protected snippets cannot be forked" };
    if (!params.hasFiles) return { allowed: false, error: "Snippet has no files to fork" };
    return { allowed: true };
  }

  it("allows forking a PUBLIC snippet", () => {
    const r = validateFork({ snippetExists: true, isOwnSnippet: false, visibility: "PUBLIC", hasPassword: false, hasFiles: true });
    assert.strictEqual(r.allowed, true);
  });
  it("allows forking a SHARED snippet", () => {
    const r = validateFork({ snippetExists: true, isOwnSnippet: false, visibility: "SHARED", hasPassword: false, hasFiles: true });
    assert.strictEqual(r.allowed, true);
  });
  it("rejects forking own snippet", () => {
    const r = validateFork({ snippetExists: true, isOwnSnippet: true, visibility: "PUBLIC", hasPassword: false, hasFiles: true });
    assert.strictEqual(r.allowed, false);
    assert.ok(r.error?.includes("own snippet"));
  });
  it("rejects forking non-existent snippet", () => {
    const r = validateFork({ snippetExists: false, isOwnSnippet: false, visibility: "PUBLIC", hasPassword: false, hasFiles: true });
    assert.strictEqual(r.allowed, false);
    assert.ok(r.error?.includes("not found"));
  });
  it("rejects forking PRIVATE snippet", () => {
    const r = validateFork({ snippetExists: true, isOwnSnippet: false, visibility: "PRIVATE", hasPassword: false, hasFiles: true });
    assert.strictEqual(r.allowed, false);
    assert.ok(r.error?.includes("not forkable"));
  });
  it("rejects password-protected snippet", () => {
    const r = validateFork({ snippetExists: true, isOwnSnippet: false, visibility: "PUBLIC", hasPassword: true, hasFiles: true });
    assert.strictEqual(r.allowed, false);
    assert.ok(r.error?.includes("Password-protected"));
  });
  it("rejects snippet with no files", () => {
    const r = validateFork({ snippetExists: true, isOwnSnippet: false, visibility: "PUBLIC", hasPassword: false, hasFiles: false });
    assert.strictEqual(r.allowed, false);
    assert.ok(r.error?.includes("no files"));
  });
});

describe("Rate Limiting Logic", () => {
  function checkRateLimit(
    counters: Map<string, { count: number; resetAt: number }>,
    key: string,
    maxRequests: number,
    windowMs: number
  ): boolean {
    const now = Date.now();
    const entry = counters.get(key);
    if (!entry || now > entry.resetAt) {
      counters.set(key, { count: 1, resetAt: now + windowMs });
      return true;
    }
    if (entry.count >= maxRequests) return false;
    entry.count++;
    return true;
  }

  it("allows requests within limit", () => {
    const counters = new Map<string, { count: number; resetAt: number }>();
    for (let i = 0; i < 5; i++) {
      assert.strictEqual(checkRateLimit(counters, "user-1", 10, 60000), true);
    }
  });
  it("blocks after exceeding limit", () => {
    const counters = new Map<string, { count: number; resetAt: number }>();
    for (let i = 0; i < 10; i++) {
      checkRateLimit(counters, "user-1", 10, 60000);
    }
    assert.strictEqual(checkRateLimit(counters, "user-1", 10, 60000), false);
  });
  it("resets count after window expires", () => {
    const counters = new Map<string, { count: number; resetAt: number }>();
    for (let i = 0; i < 10; i++) {
      checkRateLimit(counters, "user-1", 10, 60000);
    }
    const entry = counters.get("user-1")!;
    entry.resetAt = Date.now() - 1000;
    assert.strictEqual(checkRateLimit(counters, "user-1", 10, 60000), true);
  });
  it("tracks different keys independently", () => {
    const counters = new Map<string, { count: number; resetAt: number }>();
    for (let i = 0; i < 10; i++) {
      checkRateLimit(counters, "user-1", 10, 60000);
    }
    assert.strictEqual(checkRateLimit(counters, "user-1", 10, 60000), false);
    assert.strictEqual(checkRateLimit(counters, "user-2", 10, 60000), true);
  });
});

describe("Content Validation", () => {
  function validateContentSize(
    files: { code: string }[],
    maxChars: number
  ): { valid: boolean; totalChars: number } {
    let totalChars = 0;
    for (const f of files) {
      totalChars += f.code.length;
    }
    return { valid: totalChars <= maxChars, totalChars };
  }

  it("accepts content within limit", () => {
    const r = validateContentSize([{ code: "x".repeat(1000) }], 5000);
    assert.strictEqual(r.valid, true);
  });
  it("rejects content exceeding limit", () => {
    const r = validateContentSize([{ code: "x".repeat(5001) }], 5000);
    assert.strictEqual(r.valid, false);
  });
  it("sums across multiple files", () => {
    const r = validateContentSize([
      { code: "x".repeat(1000) },
      { code: "y".repeat(1000) },
      { code: "z".repeat(1000) },
    ], 5000);
    assert.strictEqual(r.valid, true);
    assert.strictEqual(r.totalChars, 3000);
  });
  it("rejects exactly at limit+1", () => {
    const r = validateContentSize([{ code: "x".repeat(5001) }], 5000);
    assert.strictEqual(r.valid, false);
  });
  it("accepts exactly at limit", () => {
    const r = validateContentSize([{ code: "x".repeat(5000) }], 5000);
    assert.strictEqual(r.valid, true);
  });
});

describe("Visibility Access Control Matrix", () => {
  function canAccess(params: {
    isOwner: boolean;
    visibility: string;
    hasToken: boolean;
    tokenValid: boolean;
  }): boolean {
    if (params.isOwner) return true;
    if (params.visibility === "PUBLIC") return true;
    if (params.visibility === "SHARED" && params.hasToken && params.tokenValid) return true;
    return false;
  }

  it("owner always has access", () => {
    assert.strictEqual(canAccess({ isOwner: true, visibility: "PRIVATE", hasToken: false, tokenValid: false }), true);
    assert.strictEqual(canAccess({ isOwner: true, visibility: "PUBLIC", hasToken: false, tokenValid: false }), true);
  });
  it("PUBLIC is accessible to anyone", () => {
    assert.strictEqual(canAccess({ isOwner: false, visibility: "PUBLIC", hasToken: false, tokenValid: false }), true);
  });
  it("SHARED requires valid token", () => {
    assert.strictEqual(canAccess({ isOwner: false, visibility: "SHARED", hasToken: true, tokenValid: true }), true);
  });
  it("SHARED rejected without token", () => {
    assert.strictEqual(canAccess({ isOwner: false, visibility: "SHARED", hasToken: false, tokenValid: false }), false);
  });
  it("SHARED rejected with invalid token", () => {
    assert.strictEqual(canAccess({ isOwner: false, visibility: "SHARED", hasToken: true, tokenValid: false }), false);
  });
  it("PRIVATE only accessible by owner", () => {
    assert.strictEqual(canAccess({ isOwner: false, visibility: "PRIVATE", hasToken: false, tokenValid: false }), false);
  });
});
