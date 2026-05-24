# KoalaSnippets Test Suite

## Overview

This directory contains the complete automated test suite for KoalaSnippets.  
Tests run via Node.js native test runner (`node --test`) with TypeScript support via `tsx`.

```bash
npm test
```

## Directory Structure

```
tests/
  README.md                       # This file
  auth.test.ts                    # Argon2 password hashing & verification
  backup-regex.test.ts            # GFS backup filename date parsing
  etag.test.ts                    # HTTP ETag generation & conditional caching
  path-traversal.test.ts          # Path traversal vulnerability detection

  unit/                           # Isolated unit tests (no DB/server needed)
    api-keys.test.ts              # API token generation, hashing, timing-safe comparison
    importer-security.test.ts     # SSRF protection, URL validation, filename sanitization
    tools.test.ts                 # Base64, hash, JWT decode, QR encoding utilities
    validations.test.ts           # Zod schemas, input validation boundaries

  integration/                    # API handler & workflow tests
    api-security.test.ts          # Auth guards, CSRF, rate limiting, visibility enforcement

  cli/                            # CLI script tests
    koala.test.ts                 # Argument parsing, command routing, output validation

  security/                       # Security-focused tests
    sql-injection.test.ts         # SQL injection vectors, XSS patterns, input escaping
```

## Adding New Tests

When you implement a new feature, add corresponding tests following these rules:

1. **Unit tests** go in `tests/unit/` — test pure functions in isolation
2. **Integration tests** go in `tests/integration/` — test API handlers with mock requests
3. **CLI tests** go in `tests/cli/` — test CLI command behavior
4. **Security tests** go in `tests/security/` — test against known attack vectors

### Naming Convention

Files must match `**/*.test.ts` to be discovered by the test runner.

### Test Structure

```typescript
import { describe, it } from "node:test";
import assert from "node:assert";

describe("FeatureName", () => {
  it("should behave correctly in normal case", () => {
    const result = myFunction("input");
    assert.strictEqual(result, "expected");
  });

  it("should handle edge case gracefully", () => {
    assert.throws(() => myFunction(null));
  });
});
```

### What to Test

- **Happy paths** — expected inputs produce expected outputs
- **Edge cases** — empty strings, null, undefined, very long inputs, special characters
- **Security boundaries** — injection attempts, path traversal, auth bypasses
- **Error handling** — invalid inputs produce meaningful errors, not crashes

## Running Specific Tests

```bash
# Run all tests
npm test

# Run a specific test file
npx tsx tests/unit/tools.test.ts

# Run with Node.js test runner filter
node --test --test-name-pattern="SQL" --import tsx tests/**/*.test.ts
```

## Pre-Commit Checklist

Before committing, always run:

```bash
npm run lint
npm run build
npm test
```

All three must pass with zero errors before pushing.
