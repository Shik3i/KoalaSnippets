#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const MIGRATIONS_DIR = path.join(__dirname, "../src/db/migrations");
const JOURNAL_PATH = path.join(MIGRATIONS_DIR, "meta", "_journal.json");

const DANGEROUS_PATTERNS = [
  /DROP\s+TABLE/gi,
  /DROP\s+INDEX/gi,
  /PRAGMA\s+foreign_keys/gi,
];

let appliedTags = new Set();
try {
  const journal = JSON.parse(fs.readFileSync(JOURNAL_PATH, "utf-8"));
  appliedTags = new Set(journal.entries.map(e => e.tag));
} catch {
  // If journal can't be read, check all files
}

const files = fs.readdirSync(MIGRATIONS_DIR).filter(f => f.endsWith(".sql"));
let hasErrors = false;

for (const file of files) {
  const tagName = file.replace(".sql", "");
  if (appliedTags.has(tagName)) continue;

  const content = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf-8");
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const pattern of DANGEROUS_PATTERNS) {
      if (pattern.test(line)) {
        console.error(`DANGEROUS: ${file}:${i+1}: ${line.trim()}`);
        console.error(`  Pattern: ${pattern.source}`);
        hasErrors = true;
        pattern.lastIndex = 0;
      }
    }
  }
}

if (hasErrors) {
  console.error("\nNew migration contains dangerous SQL that can cause DATA LOSS!");
  console.error("See docs/AI_INIT.md - Drizzle Migration Safety section");
  process.exit(1);
} else {
  console.log(`All ${files.length} migration files are safe`);
}
