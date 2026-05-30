import { describe, it } from "node:test";
import assert from "node:assert";
import { translateCron } from "../../src/features/tools/components/cron-tool";
import { formatSqlString } from "../../src/features/tools/components/sql-formatter-tool";

function base64ToUtf8(str: string): string {
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

function base64UrlDecode(str: string): string {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  return base64ToUtf8(str);
}

function utf8ToBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
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
    assert.strictEqual(((result as Record<string, Record<string, Record<string, unknown>>>)?.a?.b?.c), 1);
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

  it("handles complex Unicode characters roundtrip natively", () => {
    const original = "German: äöüÄÖÜß, Symbol: €, Emoji: 🚀, Asian: 日本語";
    const encoded = utf8ToBase64(original);
    const decoded = base64ToUtf8(encoded);
    assert.strictEqual(decoded, original);
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

describe("Cron translation parser", () => {
  it("translates standard wildcard expression", () => {
    const res = translateCron("* * * * *");
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.translation, "At every minute every day.");
  });

  it("translates minute step values", () => {
    const res = translateCron("*/5 * * * *");
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.translation, "At every 5 minutes starting from 0 every day.");
  });

  it("translates complex days and hours expressions", () => {
    const res = translateCron("15 14 * * 1-5");
    assert.strictEqual(res.valid, true);
    assert.ok(res.translation.includes("14:15"));
    assert.ok(res.translation.includes("Monday through Friday"));
  });

  it("rejects invalid cron expressions", () => {
    const r1 = translateCron("invalid expression");
    assert.strictEqual(r1.valid, false);
    const r2 = translateCron("*/99 * * * *");
    assert.strictEqual(r2.valid, false);
  });
});

describe("SQL Formatter", () => {
  it("capitalizes core keywords and formats select statements", () => {
    const raw = "select id,name from users where status='active' limit 10";
    const formatted = formatSqlString(raw);
    assert.ok(formatted.includes("SELECT"));
    assert.ok(formatted.includes("FROM"));
    assert.ok(formatted.includes("WHERE"));
    assert.ok(formatted.includes("LIMIT"));
    assert.ok(formatted.includes("\n"));
  });

  it("formats joins and handles indentations", () => {
    const raw = "select * from a join b on a.id = b.id";
    const formatted = formatSqlString(raw);
    assert.ok(formatted.includes("JOIN"));
    assert.ok(formatted.includes("ON"));
  });
});
