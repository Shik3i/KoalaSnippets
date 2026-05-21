import { createHighlighter, type Highlighter, type BundledLanguage } from "shiki";

let highlighter: Highlighter | null = null;

const LANGUAGES: BundledLanguage[] = [
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
      langs: LANGUAGES,
    });
  }
  return highlighter;
}

export async function highlightCode(code: string, language: string, theme: "dark" | "light" = "dark"): Promise<string> {
  const hl = await getHighlighter();

  const lang = hl.getLoadedLanguages().includes(language) ? language : "plaintext";
  const themeName = theme === "dark" ? THEME_DARK : THEME_LIGHT;

  return hl.codeToHtml(code, {
    lang,
    theme: themeName,
  });
}

export function getAvailableLanguages(): string[] {
  return highlighter?.getLoadedLanguages() ?? LANGUAGES;
}
