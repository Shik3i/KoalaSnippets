import { describe, it } from "node:test";
import assert from "node:assert";
import {
  generateETag,
  generateETagFromData,
  isNotModified,
} from "../src/features/core/utils/etag";

describe("generateETag", () => {
  it("produces a deterministic hash for the same inputs", () => {
    const a = generateETag("test", 42);
    const b = generateETag("test", 42);
    assert.strictEqual(a, b);
  });

  it("produces different hashes for different inputs", () => {
    const a = generateETag("test", 1);
    const b = generateETag("test", 2);
    assert.notStrictEqual(a, b);
  });

  it("wraps the value in double quotes", () => {
    const etag = generateETag("snippet-1");
    assert.ok(etag.startsWith('"'));
    assert.ok(etag.endsWith('"'));
  });

  it("handles Date objects", () => {
    const d1 = new Date("2025-01-01T00:00:00Z");
    const d2 = new Date("2025-01-01T00:00:00Z");
    assert.strictEqual(generateETag(d1), generateETag(d2));
  });

  it("handles null and undefined as empty strings", () => {
    const a = generateETag(null);
    const b = generateETag(undefined);
    const c = generateETag("");
    assert.strictEqual(a, b);
    assert.strictEqual(a, c);
  });

  it("includes all sources in hash - different order = different hash", () => {
    const a = generateETag("a", "b");
    const b = generateETag("b", "a");
    assert.notStrictEqual(a, b);
  });
});

describe("generateETagFromData", () => {
  it("produces deterministic etag for same data", () => {
    const a = generateETagFromData({ x: 1, y: "hello" });
    const b = generateETagFromData({ x: 1, y: "hello" });
    assert.strictEqual(a, b);
  });

  it("produces different etag for different data", () => {
    const a = generateETagFromData({ x: 1 });
    const b = generateETagFromData({ x: 2 });
    assert.notStrictEqual(a, b);
  });
});

describe("isNotModified", () => {
  function mockRequest(ifNoneMatch: string | null): Request {
    const headers = new Headers();
    if (ifNoneMatch !== null) {
      headers.set("if-none-match", ifNoneMatch);
    }
    return new Request("http://localhost/api/test", { headers });
  }

  it("returns false when no If-None-Match header is present", () => {
    const req = mockRequest(null);
    assert.strictEqual(isNotModified(req, '"abc"'), false);
  });

  it("returns true when If-None-Match matches the etag", () => {
    const req = mockRequest('"abc"');
    assert.strictEqual(isNotModified(req, '"abc"'), true);
  });

  it("returns true when If-None-Match contains wildcard *", () => {
    const req = mockRequest("*");
    assert.strictEqual(isNotModified(req, '"abc"'), true);
  });

  it("returns false when If-None-Match does not match", () => {
    const req = mockRequest('"xyz"');
    assert.strictEqual(isNotModified(req, '"abc"'), false);
  });

  it("handles multiple etags in If-None-Match", () => {
    const req = mockRequest('"abc", "def"');
    assert.strictEqual(isNotModified(req, '"def"'), true);
    assert.strictEqual(isNotModified(req, '"xyz"'), false);
  });
});
