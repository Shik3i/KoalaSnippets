import { createHighlighter, type Highlighter, type BundledLanguage } from "shiki";

let highlighter: Highlighter | null = null;

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
];

const THEME_DARK = "github-dark";
const THEME_LIGHT = "github-light";

async function getHighlighter(): Promise<Highlighter> {
  if (!highlighter) {
    highlighter = await createHighlighter({
      themes: [THEME_DARK, THEME_LIGHT],
      langs: CORE_LANGUAGES,
    });
  }
  return highlighter;
}

export async function highlightCode(code: string, language: string, theme: "dark" | "light" = "dark"): Promise<string> {
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

  const themeName = theme === "dark" ? THEME_DARK : THEME_LIGHT;

  return hl.codeToHtml(code, {
    lang: targetLang,
    theme: themeName,
  });
}

export function getAvailableLanguages(): string[] {
  return ALL_SUPPORTED_LANGUAGES;
}
