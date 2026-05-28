export type Locale = "en" | "de";

export interface Translations {
  home: string;
  mySnippets: string;
  favorites: string;
  trash: string;
  publicExplorer: string;
  devTools: string;
  statistics: string;
  adminDashboard: string;
  appearanceSettings: string;
  securitySettings: string;
  signOut: string;
  signIn: string;
  imprint: string;
  privacy: string;
  controls: string;
  collections: string;
  addCollection: string;
  collectionName: string;
  noCollections: string;
  languages: string;
  tags: string;
  recentlyAccessed: string;
  newSnippet: string;
  clearRecent: string;
  searchSnippets: string;
  filters: string;
  includeCode: string;
  code: string;
  import: string;
  selectAll: string;
  selected: string;
  matchAny: string;
  matchAll: string;
  noSnippets: string;
  noSnippetsDesc: string;
  createFirst: string;
  importFromUrl: string;
  browsePublic: string;
  trashEmpty: string;
  trashEmptyDesc: string;
  expandSidebar: string;
  collapseSidebar: string;
  expandControls: string;
  collapseControls: string;
  toggleLanguage: string;
  close: string;
  version: string;
}

export const SUPPORTED_LOCALES: Locale[] = ["en", "de"];

export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  de: "Deutsch",
};
