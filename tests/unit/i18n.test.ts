import { describe, it } from "node:test";
import assert from "node:assert";
import en from "../../src/features/core/i18n/locales/en";
import de from "../../src/features/core/i18n/locales/de";
import { SUPPORTED_LOCALES, LOCALE_LABELS, DEFAULT_LOCALE, type Translations } from "../../src/features/core/i18n/types";

const ALL_KEYS = [
  "home", "mySnippets", "favorites", "trash", "publicExplorer",
  "devTools", "statistics", "adminDashboard", "appearanceSettings",
  "securitySettings", "signOut", "signIn", "imprint", "privacy",
  "controls", "collections", "addCollection", "collectionName",
  "noCollections", "languages", "tags", "recentlyAccessed",
  "newSnippet", "clearRecent", "searchSnippets", "filters",
  "includeCode", "code", "import", "selectAll", "selected",
  "matchAny", "matchAll", "noSnippets", "noSnippetsDesc",
  "createFirst", "importFromUrl", "browsePublic", "trashEmpty",
  "trashEmptyDesc", "expandSidebar", "collapseSidebar",
  "expandControls", "collapseControls", "toggleLanguage", "close", "version",
] as const;

function getKeys(obj: Record<string, unknown>): string[] {
  return Object.keys(obj).sort();
}

describe("i18n locales", () => {
  it("both en and de have the same number of keys", () => {
    const enKeys = getKeys(en);
    const deKeys = getKeys(de);
    assert.strictEqual(enKeys.length, deKeys.length, `en has ${enKeys.length} keys, de has ${deKeys.length} keys`);
  });

  it("both en and de have exactly the same keys", () => {
    const enKeys = getKeys(en);
    const deKeys = getKeys(de);
    assert.deepStrictEqual(enKeys, deKeys);
  });

  it("all required keys exist in en locale", () => {
    for (const key of ALL_KEYS) {
      assert.ok(key in en, `Missing key "${key}" in en locale`);
    }
  });

  it("all required keys exist in de locale", () => {
    for (const key of ALL_KEYS) {
      assert.ok(key in de, `Missing key "${key}" in de locale`);
    }
  });

  it("de has no unexpected keys (same as en type)", () => {
    const deKeys = getKeys(de);
    const enKeys = getKeys(en);
    for (const key of deKeys) {
      assert.ok(enKeys.includes(key), `Unexpected key "${key}" in de locale`);
    }
  });

  it("no translation is empty", () => {
    for (const key of ALL_KEYS) {
      assert.ok(en[key as keyof typeof en].length > 0, `en.${key} is empty`);
      assert.ok(de[key as keyof typeof de].length > 0, `de.${key} is empty`);
    }
  });

  it("DEFAULT_LOCALE is en", () => {
    assert.strictEqual(DEFAULT_LOCALE, "en");
  });

  it("SUPPORTED_LOCALES contains en and de", () => {
    assert.deepStrictEqual(SUPPORTED_LOCALES, ["en", "de"]);
  });

  it("LOCALE_LABELS has labels for all supported locales", () => {
    assert.strictEqual(LOCALE_LABELS.en, "English");
    assert.strictEqual(LOCALE_LABELS.de, "Deutsch");
  });

  it("Translations type covers all keys from en locale", () => {
    const enKeys = Object.keys(en) as Array<keyof Translations>;
    for (const key of enKeys) {
      assert.strictEqual(typeof en[key], "string");
    }
  });
});
