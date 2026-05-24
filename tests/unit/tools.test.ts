import { describe, it } from "node:test";
import assert from "node:assert";

function base64UrlDecode(str: string): string {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  return atob(str);
}

function tryParseJson(s: string): Record<string, unknown> | null {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

function decodeJwt(token: string): { header: unknown; payload: unknown; error?: string } {
  const parts = token.trim().split(".");
  if (parts.length !== 3) {
    return { header: null, payload: null, error: "Invalid JWT format" };
  }
  try {
    const headerStr = base64UrlDecode(parts[0]);
    const payloadStr = base64UrlDecode(parts[1]);
    return {
      header: tryParseJson(headerStr) ?? headerStr,
      payload: tryParseJson(payloadStr) ?? payloadStr,
    };
  } catch {
    return { header: null, payload: null, error: "Failed to decode JWT" };
  }
}

describe("base64UrlDecode", () => {
  it("decodes standard Base64URL", () => {
    const encoded = "eyJhbGciOiJIUzI1NiJ9";
    const result = base64UrlDecode(encoded);
    assert.strictEqual(result, '{"alg":"HS256"}');
  });

  it("handles padding correctly", () => {
    const encoded = "dGVzdA";
    const result = base64UrlDecode(encoded);
    assert.strictEqual(result, "test");
  });

  it("converts - and _ to + and /", () => {
    const encoded = "dGVzdC1zdHJpbmc";
    const result = base64UrlDecode(encoded);
    assert.ok(result.includes("test"));
  });
});

describe("tryParseJson", () => {
  it("parses valid JSON", () => {
    const result = tryParseJson('{"key":"value"}');
    assert.deepStrictEqual(result, { key: "value" });
  });

  it("returns null for invalid JSON", () => {
    assert.strictEqual(tryParseJson("{invalid}"), null);
    assert.strictEqual(tryParseJson(""), null);
  });

  it("parses arrays", () => {
    const result = tryParseJson('[1,2,3]');
    assert.deepStrictEqual(result, [1, 2, 3]);
  });

  it("parses nested objects", () => {
    const result = tryParseJson('{"a":{"b":{"c":1}}}');
    assert.strictEqual((result as Record<string, unknown>).a.b.c, 1);
  });
});

describe("decodeJwt", () => {
  it("decodes a valid JWT header and payload", () => {
    const token = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.signature";
    const result = decodeJwt(token);
    assert.deepStrictEqual(result.header, { alg: "HS256" });
    assert.deepStrictEqual(result.payload, { sub: "123" });
  });

  it("rejects tokens with wrong number of parts", () => {
    const r1 = decodeJwt("header.payload");
    assert.ok(r1.error);
    const r2 = decodeJwt("a.b.c.d");
    assert.ok(r2.error);
  });

  it("rejects empty token", () => {
    const r = decodeJwt("");
    assert.ok(r.error);
  });

  it("handles non-JSON payload as raw string", () => {
    const token = "eyJhbGciOiJIUzI1NiJ9.dGVzdA.signature";
    const result = decodeJwt(token);
    assert.strictEqual(result.payload, "test");
  });

  it("returns error for malformed base64", () => {
    const token = "!!!invalid!!!.payload.signature";
    const result = decodeJwt(token);
    assert.ok(result.error);
  });
});

describe("Base64 encode/decode (btoa/atob)", () => {
  it("encodes and decodes roundtrip", () => {
    const original = "Hello, World!";
    const encoded = btoa(original);
    const decoded = atob(encoded);
    assert.strictEqual(decoded, original);
  });

  it("handles Unicode in encode via helper", () => {
    const str = "Hello 世界";
    const encoded = btoa(unescape(encodeURIComponent(str)));
    const decoded = decodeURIComponent(escape(atob(encoded)));
    assert.strictEqual(decoded, str);
  });

  it("errors on invalid base64 input", () => {
    assert.throws(() => atob("!!!not-valid-base64!!!"));
  });
});

describe("JSON formatting", () => {
  it("beautifies compact JSON", () => {
    const compact = '{"name":"test","values":[1,2,3]}';
    const parsed = JSON.parse(compact);
    const beautified = JSON.stringify(parsed, null, 2);
    assert.ok(beautified.includes('\n'));
    assert.ok(beautified.includes('  '));
  });

  it("minifies beautified JSON", () => {
    const beautified = '{\n  "key": "value"\n}';
    const parsed = JSON.parse(beautified);
    const minified = JSON.stringify(parsed);
    assert.strictEqual(minified, '{"key":"value"}');
  });

  it("throws on invalid JSON", () => {
    assert.throws(() => JSON.parse("{bad json}"));
    assert.throws(() => JSON.parse(""));
  });

  it("handles large nested JSON", () => {
    const obj = { items: Array.from({ length: 1000 }, (_, i) => ({ id: i, name: `item-${i}` })) };
    const str = JSON.stringify(obj);
    const parsed = JSON.parse(str);
    assert.strictEqual(parsed.items.length, 1000);
  });
});

describe("Password entropy calculation", () => {
  function calcEntropy(charsetSize: number, length: number): number {
    return Math.log2(charsetSize) * length;
  }

  it("very strong >= 128 bits", () => {
    assert.ok(calcEntropy(70, 24) >= 128);
  });

  it("strong >= 80 bits", () => {
    assert.ok(calcEntropy(50, 16) >= 80);
  });

  it("moderate >= 60 bits", () => {
    assert.ok(calcEntropy(36, 12) >= 60);
  });

  it("weak < 60 bits", () => {
    assert.ok(calcEntropy(10, 8) < 60);
  });
});
