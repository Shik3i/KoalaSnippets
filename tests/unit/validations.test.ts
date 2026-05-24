import { describe, it } from "node:test";
import assert from "node:assert";
import { z } from "zod";

const snippetSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(5000).optional(),
  code: z.string().optional(),
  language: z.string().optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  visibility: z.enum(["PRIVATE", "SHARED", "PUBLIC"]).optional().default("PRIVATE"),
  files: z.array(z.object({
    filename: z.string().min(1).max(200),
    code: z.string().min(1),
    language: z.string().min(1).max(50),
  })).optional(),
  password: z.string().max(128).optional(),
  expiresAt: z.string().datetime().optional(),
});

const importSchema = z.object({
  url: z.string().url().max(2048),
  title: z.string().min(1).max(500).optional(),
  visibility: z.enum(["PRIVATE", "SHARED", "PUBLIC"]).optional().default("PRIVATE"),
});

const apiKeySchema = z.object({
  name: z.string().min(1).max(100),
});

describe("snippetSchema", () => {
  it("accepts minimal valid snippet", () => {
    const result = snippetSchema.safeParse({
      title: "Hello World",
      code: "console.log('hi')",
      language: "javascript",
    });
    assert.strictEqual(result.success, true);
  });

  it("rejects empty title", () => {
    const result = snippetSchema.safeParse({ title: "", code: "x", language: "js" });
    assert.strictEqual(result.success, false);
  });

  it("rejects title over 500 chars", () => {
    const result = snippetSchema.safeParse({ title: "a".repeat(501), code: "x", language: "js" });
    assert.strictEqual(result.success, false);
  });

  it("accepts snippet with files array", () => {
    const result = snippetSchema.safeParse({
      title: "Multi-file",
      files: [
        { filename: "a.ts", code: "const x = 1", language: "typescript" },
        { filename: "b.css", code: "body {}", language: "css" },
      ],
    });
    assert.strictEqual(result.success, true);
  });

  it("rejects file with empty code", () => {
    const result = snippetSchema.safeParse({
      title: "Test",
      files: [{ filename: "a.ts", code: "", language: "typescript" }],
    });
    assert.strictEqual(result.success, false);
  });

  it("rejects more than 20 tags", () => {
    const result = snippetSchema.safeParse({
      title: "Test",
      code: "x",
      language: "js",
      tags: Array.from({ length: 21 }, (_, i) => `tag-${i}`),
    });
    assert.strictEqual(result.success, false);
  });

  it("rejects tag longer than 50 chars", () => {
    const result = snippetSchema.safeParse({
      title: "Test",
      code: "x",
      language: "js",
      tags: ["a".repeat(51)],
    });
    assert.strictEqual(result.success, false);
  });

  it("accepts valid visibility values", () => {
    for (const v of ["PRIVATE", "SHARED", "PUBLIC"]) {
      const result = snippetSchema.safeParse({ title: "T", code: "x", language: "js", visibility: v });
      assert.strictEqual(result.success, true);
    }
  });

  it("rejects invalid visibility", () => {
    const result = snippetSchema.safeParse({ title: "T", code: "x", language: "js", visibility: "DELETED" });
    assert.strictEqual(result.success, false);
  });
});

describe("importSchema", () => {
  it("accepts valid URL", () => {
    const result = importSchema.safeParse({ url: "https://example.com/file.ts" });
    assert.strictEqual(result.success, true);
  });

  it("rejects non-URL input", () => {
    const result = importSchema.safeParse({ url: "not-a-url" });
    assert.strictEqual(result.success, false);
  });

  it("rejects URL over 2048 chars", () => {
    const result = importSchema.safeParse({ url: "https://example.com/" + "a".repeat(2048) });
    assert.strictEqual(result.success, false);
  });

  it("rejects empty URL", () => {
    const result = importSchema.safeParse({ url: "" });
    assert.strictEqual(result.success, false);
  });

  it("accepts optional title", () => {
    const result = importSchema.safeParse({ url: "https://example.com", title: "My Import" });
    assert.strictEqual(result.success, true);
  });
});

describe("apiKeySchema", () => {
  it("accepts valid name", () => {
    const result = apiKeySchema.safeParse({ name: "My CLI Key" });
    assert.strictEqual(result.success, true);
  });

  it("rejects empty name", () => {
    const result = apiKeySchema.safeParse({ name: "" });
    assert.strictEqual(result.success, false);
  });

  it("rejects name over 100 chars", () => {
    const result = apiKeySchema.safeParse({ name: "a".repeat(101) });
    assert.strictEqual(result.success, false);
  });
});

describe("Input boundary testing (fuzzing)", () => {
  it("handles SQL-like injection in title", () => {
    const payloads = [
      "'; DROP TABLE snippets; --",
      "1' OR '1'='1",
      "\"; DELETE FROM users; --",
      "`; DROP DATABASE; --",
      "' UNION SELECT * FROM users --",
    ];
    for (const p of payloads) {
      const result = snippetSchema.safeParse({ title: p, code: "x", language: "js" });
      assert.strictEqual(result.success, true, `Should accept: ${p}`);
    }
  });

  it("handles XSS-like payloads in title", () => {
    const payloads = [
      "<script>alert(1)</script>",
      "<img src=x onerror=alert(1)>",
      `" onload="alert(1)`,
      "{{constructor.constructor('alert(1)')()}}",
      "<svg/onload=alert(1)>",
    ];
    for (const p of payloads) {
      const result = snippetSchema.safeParse({ title: p, code: "x", language: "js" });
      assert.strictEqual(result.success, true, `Should accept: ${p}`);
    }
  });

  it("handles Unicode and emoji in title", () => {
    const result = snippetSchema.safeParse({
      title: "🎉 Unicode Test 世界 🌍 émojis",
      code: "x",
      language: "js",
    });
    assert.strictEqual(result.success, true);
  });

  it("rejects excessively large payloads", () => {
    const result = snippetSchema.safeParse({
      title: "Test",
      code: "x",
      language: "js",
      description: "a".repeat(5001),
    });
    assert.strictEqual(result.success, false);
  });
});
