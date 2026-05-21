import { createHighlighter, type Highlighter, type BundledLanguage, type BundledTheme } from "shiki";

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

const THEME_DEFAULT = "github-dark";

async function getHighlighter(): Promise<Highlighter> {
  if (!highlighter) {
    highlighter = await createHighlighter({
      themes: [THEME_DEFAULT],
      langs: CORE_LANGUAGES,
    });
  }
  return highlighter;
}

export async function highlightCode(code: string, language: string, themeName: string = "github-dark"): Promise<string> {
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

  return hl.codeToHtml(code, {
    lang: targetLang,
    theme: activeTheme,
  });
}

export function getAvailableLanguages(): string[] {
  return ALL_SUPPORTED_LANGUAGES;
}
