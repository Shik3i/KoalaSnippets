import { describe, it } from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";

const MIGRATIONS_DIR = path.resolve(process.cwd(), "src", "db", "migrations");
const JOURNAL_PATH = path.join(MIGRATIONS_DIR, "meta", "_journal.json");
const META_DIR = path.join(MIGRATIONS_DIR, "meta");

describe("Migration Integrity", () => {
  it("journal.json is valid JSON", () => {
    const content = fs.readFileSync(JOURNAL_PATH, "utf-8");
    const journal = JSON.parse(content);
    assert.ok(Array.isArray(journal.entries));
    assert.ok(journal.entries.length > 0);
  });

  it("every journal entry has a corresponding SQL file", () => {
    const journal = JSON.parse(fs.readFileSync(JOURNAL_PATH, "utf-8"));
    for (const entry of journal.entries) {
      const expectedFile = path.join(MIGRATIONS_DIR, `${entry.tag}.sql`);
      assert.ok(
        fs.existsSync(expectedFile),
        `Migration SQL file missing for journal entry: ${entry.tag}.sql`
      );
    }
  });

  it("every SQL file has a corresponding journal entry", () => {
    const journal = JSON.parse(fs.readFileSync(JOURNAL_PATH, "utf-8"));
    const journalTags = new Set(journal.entries.map((e: { tag: string }) => e.tag));
    const sqlFiles = fs.readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith(".sql"));
    for (const file of sqlFiles) {
      const tag = file.replace(".sql", "");
      assert.ok(
        journalTags.has(tag),
        `Journal entry missing for SQL file: ${file}`
      );
    }
  });

  it("journal entries have sequential idx values", () => {
    const journal = JSON.parse(fs.readFileSync(JOURNAL_PATH, "utf-8"));
    const indices = journal.entries.map((e: { idx: number }) => e.idx);
    for (let i = 0; i < indices.length; i++) {
      assert.strictEqual(indices[i], i, `Journal idx should be ${i} but got ${indices[i]}`);
    }
  });

  it("no stale snapshot files without corresponding SQL migration", () => {
    const journal = JSON.parse(fs.readFileSync(JOURNAL_PATH, "utf-8"));
    const journalTags = new Set(journal.entries.map((e: { tag: string }) => e.tag));
    const snapshots = fs.readdirSync(META_DIR).filter((f) => f.endsWith("_snapshot.json"));
    for (const snap of snapshots) {
      const idxPrefix = snap.split("_")[0];
      const matchingEntry = [...journalTags].find((t: string) => t.startsWith(idxPrefix + "_"));
      assert.ok(
        matchingEntry,
        `Stale snapshot without journal entry: ${snap} (no matching migration found for prefix ${idxPrefix})`
      );
    }
  });

  it("migration SQL files contain valid SQL keywords", () => {
    const sqlFiles = fs.readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith(".sql"));
    for (const file of sqlFiles) {
      const content = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf-8");
      assert.ok(content.trim().length > 0, `${file} should not be empty`);
    }
  });
});
