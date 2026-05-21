import { test } from "node:test";
import assert from "node:assert";
import path from "node:path";

// A secure validation helper
export function isPathSafe(backupDir: string, download: string): boolean {
  const resolvedDir = path.resolve(backupDir) + path.sep;
  const filePath = path.join(backupDir, download);
  const resolvedFile = path.resolve(filePath);
  
  return resolvedFile.startsWith(resolvedDir) || resolvedFile === path.resolve(backupDir);
}

// The broken validation helper (reproducing F-02)
export function isPathSafeBroken(backupDir: string, download: string): boolean {
  const filePath = path.join(backupDir, download);
  const resolvedFile = path.resolve(filePath);
  const resolvedDir = path.resolve(backupDir);
  
  return resolvedFile.startsWith(resolvedDir);
}

test("Path Traversal - Sibling Directory Vulnerability Detection", () => {
  const backupDir = "./backups";
  
  // Sibling path escape attempt:
  // e.g. resolves to "./backups-secret/confidential.db"
  const attackerInput = "../backups-secret/confidential.db";
  
  // 1. Broken implementation permits it
  const isSafeUnderBroken = isPathSafeBroken(backupDir, attackerInput);
  assert.strictEqual(
    isSafeUnderBroken,
    true,
    "F-02 VULNERABILITY REPRODUCTION: Broken check incorrectly returns true for sibling directories!"
  );
  
  // 2. Fixed implementation rejects it
  const isSafeUnderFixed = isPathSafe(backupDir, attackerInput);
  assert.strictEqual(
    isSafeUnderFixed,
    false,
    "F-02 SECURE REMEDIATION: Fixed check should correctly block sibling directory traversal!"
  );
  
  // 3. Normal backup file should be allowed
  const safeInput = "backup-2026-05-21T15-47-22-123Z.db";
  assert.strictEqual(
    isPathSafe(backupDir, safeInput),
    true,
    "SECURE REMEDIATION: Fixed check should still allow legitimate backup file downloads"
  );
});
