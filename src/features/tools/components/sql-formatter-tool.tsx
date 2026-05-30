"use client";

import { useState } from "react";
import { Copy, Check, Minimize2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocalStorageState } from "../hooks/use-local-storage-state";

// Highly efficient and robust local SQL Formatter tokenizer in TypeScript.
// Handles indentation and capitalizing common SQL keywords cleanly.
export function formatSqlString(sql: string): string {
  if (!sql.trim()) return "";

  // 1. Minify/compress the string first (removes extraneous spaces/newlines)
  const cleanSql = sql
    .replace(/\s+/g, " ")
    .replace(/\s*,\s*/g, ", ")
    .replace(/\s*\(\s*/g, " (")
    .replace(/\s*\)\s*/g, ") ")
    .trim();

  // Core SQL keywords to capitalize and start new lines with
  const majorKeywords = [
    "SELECT",
    "FROM",
    "WHERE",
    "AND",
    "OR",
    "LEFT JOIN",
    "RIGHT JOIN",
    "INNER JOIN",
    "OUTER JOIN",
    "JOIN",
    "ON",
    "GROUP BY",
    "ORDER BY",
    "LIMIT",
    "INSERT INTO",
    "VALUES",
    "UPDATE",
    "SET",
    "DELETE FROM",
    "CREATE TABLE",
    "ALTER TABLE",
  ];

  // Additional keywords to just capitalize in place
  const inlineKeywords = [
    "AS",
    "IN",
    "ON",
    "IS",
    "NOT",
    "NULL",
    "LIKE",
    "INTO",
    "ASC",
    "DESC",
    "HAVING",
    "UNION",
    "ALL",
    "EXISTS",
    "ANY",
    "DISTINCT",
    "CASE",
    "WHEN",
    "THEN",
    "ELSE",
    "END",
  ];

  let formatted = cleanSql;

  // Capitalize all inline keywords (with boundary checks)
  for (const kw of inlineKeywords) {
    const regex = new RegExp(`\\b${kw}\\b`, "gi");
    formatted = formatted.replace(regex, kw);
  }

  // Capitalize major keywords and add temporary placement markers
  for (const kw of majorKeywords) {
    const regex = new RegExp(`\\b${kw}\\b`, "gi");
    formatted = formatted.replace(regex, `__SQL_NEWLINE__${kw}`);
  }

  // Split by the custom newline markers
  const lines = formatted.split("__SQL_NEWLINE__");
  const finalLines: string[] = [];
  let indentLevel = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Adjust indentation level for brackets or specific DDL groupings
    const openBrackets = (line.match(/\(/g) || []).length;
    const closeBrackets = (line.match(/\)/g) || []).length;

    // Apply current indentation
    const indent = "  ".repeat(Math.max(0, indentLevel));
    
    // Add to final array
    finalLines.push(indent + line);

    // Increment indentation for bracket openings
    indentLevel += openBrackets - closeBrackets;
  }

  return finalLines.join("\n").replace(/\(\s+/g, "(").replace(/\s+\)/g, ")");
}

export function SqlFormatterTool() {
  const [input, setInput] = useLocalStorageState<string>("koalatools_sql_input", "");
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);

  const handleFormat = () => {
    setOutput(formatSqlString(input));
  };

  const handleMinify = () => {
    if (!input.trim()) return;
    const minified = input
      .replace(/\s+/g, " ")
      .replace(/\s*,\s*/g, ", ")
      .replace(/\s*=\s*/g, " = ")
      .replace(/\s*\(\s*/g, " (")
      .replace(/\s*\)\s*/g, ") ")
      .trim();
    setOutput(minified);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <textarea
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
          setOutput("");
        }}
        placeholder="SELECT a.id, a.name, b.value FROM users a LEFT JOIN details b ON a.id = b.user_id WHERE a.status = 'active' AND b.value > 100 ORDER BY a.created_at DESC LIMIT 10;"
        className="w-full h-36 px-4 py-3 bg-card border border-border rounded-lg font-mono text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary"
      />
      <div className="flex flex-wrap gap-2">
        <Button onClick={handleFormat} disabled={!input} className="gap-1.5">
          <Sparkles size={14} className="text-amber-400 fill-amber-400" /> Prettify SQL
        </Button>
        <Button onClick={handleMinify} disabled={!input} variant="outline" className="gap-1.5">
          <Minimize2 size={14} /> Minify SQL
        </Button>
      </div>

      {output && (
        <div className="relative animate-in fade-in slide-in-from-bottom-2 duration-200">
          <textarea
            readOnly
            value={output}
            rows={Math.min(20, output.split("\n").length)}
            className="w-full px-4 py-3 bg-muted/50 border border-border rounded-lg font-mono text-sm resize-none focus:outline-none"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCopy}
            className="absolute top-2 right-2"
            aria-label="Copy"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
          </Button>
        </div>
      )}
    </div>
  );
}
