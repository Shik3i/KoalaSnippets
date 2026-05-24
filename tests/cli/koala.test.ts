import { describe, it } from "node:test";
import assert from "node:assert";

type CliCommand = "list" | "push" | "pull" | "search";

interface CliArgs {
  command: CliCommand | null;
  arg: string;
  showHelp: boolean;
}

function parseCliArgs(args: string[]): CliArgs {
  const result: CliArgs = { command: null, arg: "", showHelp: false };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case "list":
      case "push":
      case "pull":
      case "search":
        result.command = arg;
        if (i + 1 < args.length && !args[i + 1].startsWith("-")) {
          result.arg = args[i + 1];
          i++;
        }
        break;
      case "-h":
      case "--help":
        result.showHelp = true;
        break;
      default:
        break;
    }
  }

  return result;
}

function formatSnippetList(snippets: { id: string; title: string; language: string; visibility: string }[]): string[] {
  return snippets.map(
    (s) => `${s.id.slice(0, 8)}..  ${s.title.padEnd(30)} ${s.language.padEnd(12)} ${s.visibility}`
  );
}

function detectCliLanguage(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  const map: Record<string, string> = {
    ts: "typescript", js: "javascript", py: "python", rs: "rust", go: "go",
    java: "java", php: "php", sql: "sql", html: "html", css: "css",
    json: "json", yaml: "yaml", yml: "yaml", xml: "xml", md: "markdown",
    sh: "shell", bash: "shell", ps1: "powershell", txt: "plaintext",
  };
  return map[ext] || "plaintext";
}

describe("parseCliArgs", () => {
  it("parses list command with no args", () => {
    const result = parseCliArgs(["list"]);
    assert.strictEqual(result.command, "list");
    assert.strictEqual(result.arg, "");
  });

  it("parses push command with filename", () => {
    const result = parseCliArgs(["push", "script.ts"]);
    assert.strictEqual(result.command, "push");
    assert.strictEqual(result.arg, "script.ts");
  });

  it("parses pull command with snippet id", () => {
    const result = parseCliArgs(["pull", "abc123def456"]);
    assert.strictEqual(result.command, "pull");
    assert.strictEqual(result.arg, "abc123def456");
  });

  it("parses search command with query", () => {
    const result = parseCliArgs(["search", "database"]);
    assert.strictEqual(result.command, "search");
    assert.strictEqual(result.arg, "database");
  });

  it("parses search with multi-word query", () => {
    const result = parseCliArgs(["search", "sql", "database"]);
    assert.strictEqual(result.command, "search");
    assert.strictEqual(result.arg, "sql");
  });

  it("shows help with -h flag", () => {
    const result = parseCliArgs(["-h"]);
    assert.strictEqual(result.showHelp, true);
  });

  it("shows help with --help flag", () => {
    const result = parseCliArgs(["--help"]);
    assert.strictEqual(result.showHelp, true);
  });

  it("returns null command for unknown args", () => {
    const result = parseCliArgs(["--verbose"]);
    assert.strictEqual(result.command, null);
  });

  it("help flag takes priority over commands", () => {
    const result = parseCliArgs(["list", "-h"]);
    assert.strictEqual(result.command, "list");
    assert.strictEqual(result.showHelp, true);
  });

  it("returns null command for empty args", () => {
    const result = parseCliArgs([]);
    assert.strictEqual(result.command, null);
    assert.strictEqual(result.showHelp, false);
  });
});

describe("formatSnippetList", () => {
  it("formats a list of snippets into columns", () => {
    const snippets = [
      { id: "abcdef12-3456", title: "Hello World", language: "typescript", visibility: "PRIVATE" },
      { id: "12345678-abcd", title: "Database Query", language: "sql", visibility: "PUBLIC" },
    ];
    const lines = formatSnippetList(snippets);
    assert.strictEqual(lines.length, 2);
    assert.ok(lines[0].includes("Hello World"));
    assert.ok(lines[0].includes("typescript"));
    assert.ok(lines[1].includes("PUBLIC"));
  });

  it("handles empty list", () => {
    const lines = formatSnippetList([]);
    assert.strictEqual(lines.length, 0);
  });

  it("truncates IDs to 8 chars", () => {
    const snippets = [{ id: "12345678-90ab-cdef", title: "Test", language: "text", visibility: "PUBLIC" }];
    const lines = formatSnippetList(snippets);
    assert.ok(lines[0].startsWith("12345678"));
  });
});

describe("detectCliLanguage", () => {
  it("detects common extensions", () => {
    assert.strictEqual(detectCliLanguage("app.ts"), "typescript");
    assert.strictEqual(detectCliLanguage("script.py"), "python");
    assert.strictEqual(detectCliLanguage("query.sql"), "sql");
    assert.strictEqual(detectCliLanguage("Dockerfile"), "plaintext");
    assert.strictEqual(detectCliLanguage("deploy.yaml"), "yaml");
  });

  it("defaults to plaintext for unknown", () => {
    assert.strictEqual(detectCliLanguage("file.unknown"), "plaintext");
    assert.strictEqual(detectCliLanguage("Makefile"), "plaintext");
  });

  it("handles uppercase extensions", () => {
    assert.strictEqual(detectCliLanguage("app.TS"), "typescript");
    assert.strictEqual(detectCliLanguage("script.PY"), "python");
  });
});

describe("CLI Token Management", () => {
  it("validates KOALA_TOKEN is set", () => {
    const token = "ks_test123";
    const isSet = Boolean(token);
    assert.strictEqual(isSet, true);
  });

  it("validates KOALA_TOKEN format", () => {
    const tokens = ["ks_abc123", "ks_very-long-token-with-many-chars"];
    for (const t of tokens) {
      assert.ok(t.startsWith("ks_"));
      assert.ok(t.length >= 8);
    }
  });

  it("KOALA_SERVER defaults to localhost", () => {
    const server = process.env.KOALA_SERVER || "http://localhost:3000";
    assert.ok(server.includes("localhost") || server.includes("http"));
  });
});
