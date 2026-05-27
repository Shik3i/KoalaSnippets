import { createHighlighter, type Highlighter, type BundledLanguage, type BundledTheme } from "shiki";
import crypto from "crypto";

const highlightCache = new Map<string, string>();
const MAX_CACHE_SIZE = 1000;

let highlighterPromise: Promise<Highlighter> | null = null;

const CORE_LANGUAGES: BundledLanguage[] = [
  "javascript",
  "typescript",
  "python",
  "html",
  "css"
];

const ALL_SUPPORTED_LANGUAGES: BundledLanguage[] = [
  "typescript",
  "javascript",
  "python",
  "rust",
  "go",
  "java",
  "c",
  "cpp",
  "csharp",
  "ruby",
  "php",
  "swift",
  "kotlin",
  "bash",
  "shell",
  "sql",
  "html",
  "css",
  "json",
  "yaml",
  "toml",
  "xml",
  "markdown",
  "dockerfile",
  "diff",
  "graphql",
  "lua",
  "r",
  "scala",
  "zig",
  "nginx",
  "ini",
];

export const SUPPORTED_LANGUAGES = [...ALL_SUPPORTED_LANGUAGES, "plaintext"] as string[];

const THEME_DEFAULT = "github-dark";

async function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: [THEME_DEFAULT],
      langs: CORE_LANGUAGES,
    });
  }
  return highlighterPromise;
}

export async function highlightCode(code: string, language: string, themeName: string = "github-dark"): Promise<string> {
  const codeHash = crypto.createHash("md5").update(code).digest("hex");
  const cacheKey = `${language}:${themeName}:${codeHash}`;

  if (highlightCache.has(cacheKey)) {
    return highlightCache.get(cacheKey)!;
  }

  const hl = await getHighlighter();

  let targetLang = "plaintext";
  
  if (ALL_SUPPORTED_LANGUAGES.includes(language as BundledLanguage)) {
    if (!hl.getLoadedLanguages().includes(language)) {
      try {
        await hl.loadLanguage(language as BundledLanguage);
      } catch (err) {
        console.error(`Failed to load language: ${language}`, err);
      }
    }
    
    if (hl.getLoadedLanguages().includes(language)) {
      targetLang = language;
    }
  }

  // Lazy-load the theme dynamically if not loaded yet
  if (!hl.getLoadedThemes().includes(themeName)) {
    try {
      await hl.loadTheme(themeName as BundledTheme);
    } catch (err) {
      console.error(`Failed to load theme: ${themeName}`, err);
    }
  }

  const activeTheme = hl.getLoadedThemes().includes(themeName) ? themeName : THEME_DEFAULT;

  const html = hl.codeToHtml(code, {
    lang: targetLang,
    theme: activeTheme,
  });

  // Limit cache size to prevent memory exhaustion
  if (highlightCache.size >= MAX_CACHE_SIZE) {
    const firstKey = highlightCache.keys().next().value;
    if (firstKey) {
      highlightCache.delete(firstKey);
    }
  }
  highlightCache.set(cacheKey, html);

  return html;
}

export function getAvailableLanguages(): string[] {
  return SUPPORTED_LANGUAGES;
}
