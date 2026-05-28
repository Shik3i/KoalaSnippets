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

  // Sort options
  sortNewest: string;
  sortOldest: string;
  sortAlphabetical: string;
  sortSizeLargest: string;
  sortSizeSmallest: string;
  sortSnippets: string;

  // Search & Filter
  noMatches: string;
  clearAll: string;
  collection: string;
  searchLabel: string;

  // Table headers
  headerTitle: string;
  headerLanguage: string;
  headerTags: string;
  headerVisibility: string;
  headerDate: string;

  // Visibility labels
  visibilityPrivate: string;
  visibilityShared: string;
  visibilityPublic: string;

  // Drag & Drop
  dropFilesHere: string;
  dropFilesDesc: string;
  importingFiles: string;

  // Bulk actions
  makePrivate: string;
  makePublic: string;
  delete: string;
  moveToTrash: string;
  moveToTrashDesc: string;
  movedToTrash: string;
  undo: string;
  snippetsRestored: string;
  actionCompleted: string;
  actionFailed: string;
  errorOccurred: string;
  clearSelection: string;

  // Snippet row actions
  pinned: string;
  pinSnippet: string;
  unpinSnippet: string;
  addToFavorites: string;
  removeFromFavorites: string;
  addedToFavorites: string;
  removedFromFavorites: string;
  failedToUpdateFavorite: string;
  failedToUpdatePin: string;
  snippetPinned: string;
  snippetUnpinned: string;

  // View toggle
  gridView: string;
  tableView: string;

  // Command palette
  commandPalettePlaceholder: string;
  commandPaletteSearching: string;
  commandPaletteNoResults: string;
  commandPaletteCommands: string;
  commandPaletteSnippets: string;
  commandPaletteFooter: string;
  commandPaletteNavigate: string;
  commandPaletteSelect: string;
  // Command palette options
  cmdCreateSnippet: string;
  cmdCreateSnippetDesc: string;
  cmdToggleTheme: string;
  cmdToggleThemeDesc: string;
  cmdDevTools: string;
  cmdDevToolsDesc: string;
  cmdImport: string;
  cmdImportDesc: string;
  cmdDensityCompact: string;
  cmdDensityCompactDesc: string;
  cmdDensityPreview: string;
  cmdDensityPreviewDesc: string;
  cmdDensityFull: string;
  cmdDensityFullDesc: string;
  cmdSettings: string;
  cmdSettingsDesc: string;
  cmdAdmin: string;
  cmdAdminDesc: string;
  cmdHome: string;
  cmdHomeDesc: string;
  cmdDashboard: string;
  cmdDashboardDesc: string;
  cmdCopyLink: string;
  cmdCopyLinkDesc: string;
  cmdEditSnippet: string;
  cmdEditSnippetDesc: string;
  densitySet: string;
}

export const SUPPORTED_LOCALES: Locale[] = ["en", "de"];

export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  de: "Deutsch",
};
