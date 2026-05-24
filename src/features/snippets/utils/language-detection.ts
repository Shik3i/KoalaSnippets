// A lightweight heuristic function to detect programming languages from raw text

export function detectLanguage(code: string): string | null {
  if (!code || code.trim().length === 0) return null;

  const text = code.trim();
  const firstLine = text.split('\n')[0].trim();

  // 1. Shebangs
  if (firstLine.startsWith('#!')) {
    if (firstLine.includes('bash') || firstLine.includes('sh')) return 'bash';
    if (firstLine.includes('python')) return 'python';
    if (firstLine.includes('node')) return 'javascript';
  }

  // 2. Strict / Obvious Syntax Matches
  if (text.startsWith('<!DOCTYPE html>') || text.startsWith('<html')) return 'html';
  if (text.startsWith('<?php')) return 'php';
  
  // 3. JSON
  // Very simplistic check: starts with { or [ and ends with } or ]
  if ((text.startsWith('{') && text.endsWith('}')) || (text.startsWith('[') && text.endsWith(']'))) {
    // Check if it's somewhat valid JSON (has quotes)
    if (text.includes('"')) {
      // It might be a JS object, but JSON is a good guess if it looks like one
      return 'json';
    }
  }

  // 4. SQL
  const sqlKeywords = ['SELECT ', 'INSERT INTO ', 'UPDATE ', 'DELETE FROM ', 'CREATE TABLE '];
  const upperText = text.toUpperCase();
  if (sqlKeywords.some(keyword => upperText.includes(keyword)) && text.includes(';')) {
    return 'sql';
  }

  // 5. CSS / SCSS
  if (text.includes('body {') || text.includes('margin:') || text.includes('padding:')) {
    if (text.includes('@include') || text.includes('@mixin')) return 'scss';
    return 'css';
  }

  // 6. Python
  if (text.includes('def ') || text.includes('import ') || text.includes('print(') || text.includes('class ')) {
    if (!text.includes('{') && !text.includes('function ')) {
      return 'python';
    }
  }

  // 7. Go
  if (text.includes('package ') && (text.includes('import ') || text.includes('func '))) {
    return 'go';
  }

  // 8. Rust
  if (text.includes('fn ') && text.includes('let mut') || text.includes('println!')) {
    return 'rust';
  }

  // 9. React / JSX / TSX
  if (text.includes('import React') || (text.includes('export default function') && text.includes('<div'))) {
    if (text.includes('interface ') || text.includes('type ')) return 'tsx';
    return 'jsx';
  }

  // 10. TypeScript / JavaScript
  if (text.includes('const ') || text.includes('let ') || text.includes('console.log(')) {
    if (text.includes('interface ') || text.includes('type ') || text.includes(': string') || text.includes(': number')) {
      return 'typescript';
    }
    return 'javascript';
  }

  return null;
}

export function detectLanguageFromFilename(filename: string): string | null {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (!ext) return null;

  const map: Record<string, string> = {
    'js': 'javascript',
    'jsx': 'jsx',
    'ts': 'typescript',
    'tsx': 'tsx',
    'py': 'python',
    'go': 'go',
    'rs': 'rust',
    'rb': 'ruby',
    'php': 'php',
    'html': 'html',
    'css': 'css',
    'scss': 'scss',
    'json': 'json',
    'sql': 'sql',
    'sh': 'bash',
    'bash': 'bash',
    'md': 'markdown',
    'yaml': 'yaml',
    'yml': 'yaml',
    'xml': 'xml',
    'java': 'java',
    'c': 'c',
    'cpp': 'cpp',
    'cs': 'csharp',
  };

  return map[ext] || null;
}
