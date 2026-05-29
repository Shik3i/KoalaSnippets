# Translation & i18n System Guide

KoalaSnippets features a custom, lightweight, type-safe, and zero-dependency internationalization (i18n) framework based on React Context. 

> [!NOTE]
> Currently, **English (`en`)** and **German (`de`)** are 100% translated and supported as core languages. 

This guide details how the system is structured and outlines the exact steps to add a new translation language (e.g., Spanish `es`).

---

## Architecture Overview

All translation files reside in the `src/features/core/i18n` directory:

```
src/features/core/i18n/
  context.tsx            # I18nProvider context & useI18n hook
  types.ts               # Locale types & Translations interface (Single Source of Truth)
  locales/
    en.ts                # English translations
    de.ts                # German translations
  README.md              # This guide
```

Our design leverages strict TypeScript compilation:
1. **Central Schema**: The `Translations` interface in `types.ts` defines all required translation keys and their parameter structures.
2. **Type Enforcement**: Every dictionary file (like `en.ts` or `de.ts`) implements the `Translations` interface. This ensures that any missing key immediately throws a compile-time TypeScript error, guaranteeing 100% dictionary completeness across all languages.
3. **Automated Key-Parity Tests**: A dedicated unit test in `tests/unit/i18n.test.ts` automatically runs at build time to verify key counts, key names, and check that no translations are empty.

---

## How to Add a New Language

To add support for a new language (e.g., Spanish `es`):

### Step 1: Define the New Locale
Open `src/features/core/i18n/types.ts` and add the new locale code:
1. Append your code (e.g., `"es"`) to the `Locale` union type:
   ```typescript
   export type Locale = "en" | "de" | "es";
   ```
2. Add your code to the `SUPPORTED_LOCALES` array:
   ```typescript
   export const SUPPORTED_LOCALES: Locale[] = ["en", "de", "es"];
   ```
3. Add the human-readable display label inside `LOCALE_LABELS`:
   ```typescript
   export const LOCALE_LABELS: Record<Locale, string> = {
     en: "English",
     de: "Deutsch",
     es: "Español",
   };
   ```

### Step 2: Create the Translation Dictionary
Create a new file `src/features/core/i18n/locales/es.ts`. Define and export the dictionary using the `Translations` type interface:
```typescript
import type { Translations } from "../types";

const es: Translations = {
  home: "Descubrir",
  mySnippets: "Mis Snippets",
  favorites: "Favoritos",
  trash: "Papelera",
  // Copy and translate all other keys exactly as defined in en.ts / de.ts ...
};

export default es;
```

### Step 3: Register the Dictionary
Open `src/features/core/i18n/context.tsx` and register the new locale:
1. Import the dictionary file at the top:
   ```typescript
   import es from "./locales/es";
   ```
2. Register it inside the `LOCALES` constant mapping:
   ```typescript
   const LOCALES: Record<Locale, Translations> = { en, de, es };
   ```
3. (Optional) Enhance the fallback browser language parser in `getInitialLocale()` to detect Spanish users:
   ```typescript
   const browserLang = navigator.language.slice(0, 2);
   if (browserLang === "de") return "de";
   if (browserLang === "es") return "es";
   return "en";
   ```

### Step 4: Register keys for Key-Parity Tests
Open `tests/unit/i18n.test.ts` and update the `ALL_KEYS` array to include any new translation keys that might have been introduced, and confirm the new locale Spanish imports are integrated if testing language-specific asserts.

### Step 5: Verify the Build
Run the automated test suite and type compilation checks to confirm the new language is perfectly set up and all keys are fully mapped:
```bash
npm run test
npm run build
```
Once tests are green and compilation succeeds, the new language option will automatically appear inside the global sidebar language toggle dropdown!
