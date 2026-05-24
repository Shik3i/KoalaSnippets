import { db } from "@/db";
import { snippets, snippetFiles, siteSettings, siteStatistics } from "@/db/schema";
import { generateId } from "@/features/auth/utils/auth";
import { eq, and, isNull, count, sql } from "drizzle-orm";
import { logUserAction } from "@/features/admin/utils/audit";

const MAX_CONTENT_SIZE = 5 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 10_000;
const IMPORT_RATE_LIMIT_WINDOW_MS = 60_000;
const IMPORT_RATE_LIMIT_MAX = 10;

const userImportCounts = new Map<string, { count: number; resetAt: number }>();

function checkImportRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = userImportCounts.get(userId);
  if (!entry || now > entry.resetAt) {
    userImportCounts.set(userId, { count: 1, resetAt: now + IMPORT_RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= IMPORT_RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
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

async function resolveAndValidateHost(hostname: string): Promise<boolean> {
  const lower = hostname.toLowerCase();
  if (lower === "localhost" || lower === "127.0.0.1" || lower === "::1" || lower === "[::1]") {
    return false;
  }
  try {
    const { resolve4 } = await import("dns/promises");
    const addresses = await resolve4(hostname);
    for (const addr of addresses) {
      if (isPrivateIP(addr)) return false;
    }
    return true;
  } catch {
    return false;
  }
}

export interface ImportedFile {
  filename: string;
  code: string;
  language: string;
}

export interface ImportResult {
  success: boolean;
  files?: ImportedFile[];
  title?: string;
  error?: string;
}

export async function importFromUrl(
  url: string,
  userId: string
): Promise<ImportResult> {
  if (!checkImportRateLimit(userId)) {
    return { success: false, error: "Rate limit exceeded. Try again later." };
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return { success: false, error: "Invalid URL format" };
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    return { success: false, error: "Only HTTP and HTTPS URLs are allowed" };
  }

  const hostname = parsedUrl.hostname;
  if (isPrivateIP(hostname)) {
    return { success: false, error: "Cannot import from private or internal addresses" };
  }

  if (!(await resolveAndValidateHost(hostname))) {
    return { success: false, error: "Cannot import from private or internal addresses" };
  }

  let response: Response;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    response = await fetch(parsedUrl.toString(), {
      signal: controller.signal,
      headers: { "Accept": "text/*, application/json, application/xml" },
    });
    clearTimeout(timer);
  } catch (err) {
    const msg = err instanceof Error && err.name === "AbortError"
      ? "Request timed out"
      : "Failed to fetch URL";
    return { success: false, error: msg };
  }

  if (!response.ok) {
    return { success: false, error: `HTTP ${response.status}: Failed to fetch URL` };
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("text/html") && parsedUrl.hostname.includes("gist.github.com")) {
    return { success: false, error: "GitHub Gist API required. Use the raw file URL ending with /raw." };
  }

  let text: string;
  try {
    text = await response.text();
  } catch {
    return { success: false, error: "Failed to read response body" };
  }

  if (text.length > MAX_CONTENT_SIZE) {
    return { success: false, error: `Content too large (max ${MAX_CONTENT_SIZE / 1024 / 1024}MB)` };
  }

  const pathParts = parsedUrl.pathname.split("/").filter(Boolean);
  const rawFilename = pathParts[pathParts.length - 1] || "imported.txt";
  const filename = sanitizeFilename(rawFilename);
  const language = detectLanguage(filename);

  return {
    success: true,
    files: [{ filename, code: text, language }],
    title: filename,
  };
}

export async function createImportedSnippet(
  userId: string,
  username: string,
  title: string,
  files: ImportedFile[],
  visibility: "PRIVATE" | "SHARED" | "PUBLIC"
): Promise<{ success: boolean; id?: string; error?: string }> {
  const settings = await db.select().from(siteSettings).where(eq(siteSettings.id, 1)).get();
  const maxSnippets = settings?.maxSnippetsPerUser ?? 1000;
  const maxChars = settings?.maxCharsPerSnippet ?? 250000;

  let totalChars = 0;
  let totalLines = 0;
  for (const f of files) {
    if (typeof f.code !== "string" || typeof f.filename !== "string" || typeof f.language !== "string") {
      return { success: false, error: "Invalid file data" };
    }
    totalChars += f.code.length;
    totalLines += f.code.split("\n").length;
  }

  if (totalChars > maxChars) {
    return { success: false, error: "Content exceeds maximum snippet size" };
  }

  const newId = generateId();

  try {
    db.transaction((tx) => {
      const currentCount = tx.select({ c: count() }).from(snippets).where(
        and(eq(snippets.authorId, userId), isNull(snippets.deletedAt))
      ).get();
      if (currentCount && currentCount.c >= maxSnippets) {
        throw new Error(`Snippet quota exceeded (Max: ${maxSnippets})`);
      }

      tx.insert(snippets).values({
        id: newId,
        title: title.slice(0, 500),
        visibility,
        authorId: userId,
        totalLines,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).run();

      for (const f of files) {
        tx.insert(snippetFiles).values({
          id: generateId(),
          snippetId: newId,
          filename: sanitizeFilename(f.filename),
          code: f.code,
          language: f.language,
        }).run();
      }

      tx.update(siteStatistics)
        .set({ totalSnippetsCreated: sql`total_snippets_created + 1` })
        .where(eq(siteStatistics.id, 1)).run();
    });

    await logUserAction(userId, "CREATE", "SNIPPET", newId, `Imported "${title}"`);

    return { success: true, id: newId };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message.includes("quota") ? message : "Internal server error" };
  }
}
