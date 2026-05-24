export interface SnippetStats {
  characters: number;
  words: number;
  lines: number;
  estimatedReadTime: number;
  languageDistribution: { language: string; lines: number; percentage: number }[];
}

export function computeSnippetStats(files: { code: string; language: string }[]): SnippetStats {
  const totalLines = files.reduce((acc, f) => acc + f.code.split("\n").length, 0);
  const totalChars = files.reduce((acc, f) => acc + f.code.length, 0);
  const totalWords = files.reduce((acc, f) => acc + f.code.split(/\s+/).filter(Boolean).length, 0);
  const estimatedReadTime = Math.max(1, Math.ceil(totalLines / 50));

  const langLines = new Map<string, number>();
  for (const f of files) {
    const lines = f.code.split("\n").length;
    langLines.set(f.language, (langLines.get(f.language) ?? 0) + lines);
  }

  const languageDistribution = Array.from(langLines.entries())
    .map(([language, lines]) => ({
      language,
      lines,
      percentage: totalLines > 0 ? Math.round((lines / totalLines) * 100) : 0,
    }))
    .sort((a, b) => b.lines - a.lines);

  return {
    characters: totalChars,
    words: totalWords,
    lines: totalLines,
    estimatedReadTime,
    languageDistribution,
  };
}
