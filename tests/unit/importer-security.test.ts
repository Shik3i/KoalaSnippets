import { describe, it } from "node:test";
import assert from "node:assert";

function isPrivateIP(ip: string): boolean {
  if (ip === "127.0.0.1" || ip === "0.0.0.0" || ip === "::1" || ip === "::ffff:127.0.0.1") return true;
  if (ip.startsWith("10.")) return true;
  if (ip.startsWith("192.168.")) return true;
  if (ip.startsWith("172.")) {
    const second = parseInt(ip.split(".")[1], 10);
    if (second >= 16 && second <= 31) return true;
  }
  if (ip.startsWith("127.")) return true;
  if (ip.startsWith("0.")) return true;
  if (ip.startsWith("169.254.")) return true;
  if (ip === "localhost" || ip === "[::1]" || ip === "::1") return true;
  return false;
}

function sanitizeFilename(name: string): string {
  return name.replace(/[<>:"/\\|?*\x00-\x1f]/g, "_").slice(0, 200) || "imported";
}

function detectLanguage(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  const map: Record<string, string> = {
    ts: "typescript", tsx: "typescript", js: "javascript", jsx: "javascript",
    py: "python", rb: "ruby", rs: "rust", go: "go", java: "java",
    kt: "kotlin", swift: "swift", php: "php", c: "c", cpp: "cpp", cs: "csharp",
    sql: "sql", html: "html", css: "css", scss: "scss", json: "json",
    yaml: "yaml", yml: "yaml", xml: "xml", md: "markdown", sh: "shell",
    bash: "shell", zsh: "shell", ps1: "powershell", dockerfile: "dockerfile",
    toml: "toml", ini: "ini", txt: "plaintext",
  };
  return map[ext] || "plaintext";
}

function validateUrl(url: string): { valid: boolean; error?: string } {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { valid: false, error: "Invalid URL format" };
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { valid: false, error: "Only HTTP and HTTPS URLs are allowed" };
  }
  const hostname = parsed.hostname;
  if (isPrivateIP(hostname)) {
    return { valid: false, error: "Cannot import from private or internal addresses" };
  }
  return { valid: true };
}

describe("isPrivateIP", () => {
  it("blocks 127.0.0.1", () => assert.strictEqual(isPrivateIP("127.0.0.1"), true));
  it("blocks 0.0.0.0", () => assert.strictEqual(isPrivateIP("0.0.0.0"), true));
  it("blocks localhost", () => assert.strictEqual(isPrivateIP("localhost"), true));
  it("blocks ::1", () => assert.strictEqual(isPrivateIP("::1"), true));
  it("blocks [::1]", () => assert.strictEqual(isPrivateIP("[::1]"), true));
  it("blocks 10.x.x.x", () => {
    assert.strictEqual(isPrivateIP("10.0.0.1"), true);
    assert.strictEqual(isPrivateIP("10.255.255.255"), true);
  });
  it("blocks 192.168.x.x", () => {
    assert.strictEqual(isPrivateIP("192.168.0.1"), true);
    assert.strictEqual(isPrivateIP("192.168.255.255"), true);
  });
  it("blocks 172.16-31.x.x", () => {
    assert.strictEqual(isPrivateIP("172.16.0.1"), true);
    assert.strictEqual(isPrivateIP("172.31.255.255"), true);
  });
  it("allows 172.32.x.x (outside private range)", () => {
    assert.strictEqual(isPrivateIP("172.32.0.1"), false);
    assert.strictEqual(isPrivateIP("172.15.255.255"), false);
  });
  it("blocks 169.254.x.x (link-local)", () => {
    assert.strictEqual(isPrivateIP("169.254.1.1"), true);
  });
  it("allows public IPs", () => {
    assert.strictEqual(isPrivateIP("8.8.8.8"), false);
    assert.strictEqual(isPrivateIP("93.184.216.34"), false);
    assert.strictEqual(isPrivateIP("151.101.1.140"), false);
  });
  it("blocks 127.x.x.x range", () => {
    assert.strictEqual(isPrivateIP("127.99.99.99"), true);
  });
  it("blocks 0.x.x.x range", () => {
    assert.strictEqual(isPrivateIP("0.1.2.3"), true);
  });
});

describe("sanitizeFilename", () => {
  it("preserves valid filenames", () => {
    assert.strictEqual(sanitizeFilename("script.ts"), "script.ts");
    assert.strictEqual(sanitizeFilename("my-file.js"), "my-file.js");
  });
  it("replaces path separators", () => {
    assert.strictEqual(sanitizeFilename("../../../etc/passwd"), ".._.._.._etc_passwd");
    assert.strictEqual(sanitizeFilename("a\\b\\c"), "a_b_c");
  });
  it("replaces angle brackets and special chars", () => {
    assert.strictEqual(sanitizeFilename("<script>alert(1)</script>.html"), "_script_alert(1)__script_.html");
    assert.strictEqual(sanitizeFilename("file:name.txt"), "file_name.txt");
    assert.strictEqual(sanitizeFilename("file?query=1"), "file_query=1");
    assert.strictEqual(sanitizeFilename('file"name'), "file_name");
  });
  it("replaces null bytes and control characters", () => {
    assert.strictEqual(sanitizeFilename("test\x00file.ts"), "test_file.ts");
    assert.strictEqual(sanitizeFilename("test\x1ffile.ts"), "test_file.ts");
  });
  it("truncates filenames over 200 chars", () => {
    const long = "a".repeat(300) + ".ts";
    const result = sanitizeFilename(long);
    assert.strictEqual(result.length, 200);
  });
  it("returns 'imported' for truly empty name", () => {
    assert.strictEqual(sanitizeFilename(""), "imported");
  });
});

describe("detectLanguage", () => {
  it("detects common languages", () => {
    assert.strictEqual(detectLanguage("app.ts"), "typescript");
    assert.strictEqual(detectLanguage("app.js"), "javascript");
    assert.strictEqual(detectLanguage("app.py"), "python");
    assert.strictEqual(detectLanguage("app.rs"), "rust");
    assert.strictEqual(detectLanguage("app.go"), "go");
    assert.strictEqual(detectLanguage("app.java"), "java");
  });
  it("defaults to plaintext for unknown extensions", () => {
    assert.strictEqual(detectLanguage("app.xyz"), "plaintext");
    assert.strictEqual(detectLanguage("noExtension"), "plaintext");
  });
  it("handles uppercase extensions", () => {
    assert.strictEqual(detectLanguage("app.TS"), "typescript");
    assert.strictEqual(detectLanguage("app.PY"), "python");
  });
  it("handles compound extensions", () => {
    assert.strictEqual(detectLanguage("app.test.ts"), "typescript");
    assert.strictEqual(detectLanguage("docker-compose.yml"), "yaml");
  });
});

describe("validateUrl", () => {
  it("rejects private IP URLs", () => {
    const r = validateUrl("http://127.0.0.1/test");
    assert.strictEqual(r.valid, false);
  });
  it("rejects file:// protocol", () => {
    const r = validateUrl("file:///etc/passwd");
    assert.strictEqual(r.valid, false);
    assert.ok(r.error?.includes("Only HTTP"));
  });
  it("rejects ftp:// protocol", () => {
    const r = validateUrl("ftp://malicious.com/script.sh");
    assert.strictEqual(r.valid, false);
  });
  it("rejects invalid URLs", () => {
    const r = validateUrl("not-a-url");
    assert.strictEqual(r.valid, false);
  });
  it("accepts valid public HTTP URLs", () => {
    const r = validateUrl("https://example.com/code.ts");
    assert.strictEqual(r.valid, true);
  });
  it("rejects localhost URLs", () => {
    const r = validateUrl("http://localhost:3000/api");
    assert.strictEqual(r.valid, false);
  });
  it("rejects 192.168 URLs", () => {
    const r = validateUrl("https://192.168.1.1/secret");
    assert.strictEqual(r.valid, false);
  });
  it("rejects URLs with @ in hostname (auth bypass attempt)", () => {
    const r = validateUrl("http://evil.com@127.0.0.1/");
    assert.strictEqual(r.valid, false);
  });
});
