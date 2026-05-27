import { test } from "node:test";
import assert from "node:assert";
import { hashPassword, verifyPassword } from "../src/features/auth/utils/auth";

test("Argon2 Password Hashing and Verification Flow", async () => {
  const password = "SecurePassword123";
  
  const hash = await hashPassword(password);
  
  assert.ok(hash.startsWith("$argon2id$"), "Hash should use Argon2id format");
  
  const isValid = await verifyPassword(password, hash);
  assert.strictEqual(isValid, true, "Verification with correct password should succeed");
  
  const isInvalid = await verifyPassword("WrongPassword123", hash);
  assert.strictEqual(isInvalid, false, "Verification with incorrect password should fail");
});
