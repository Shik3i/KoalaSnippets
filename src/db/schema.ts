import { sqliteTable, text, integer, index, uniqueIndex } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

export interface UserPreferences {
  appTheme: string;
  snippetDensity: "compact" | "preview" | "full";
  syntaxTheme: string;
  bgPattern: string;
  showLineNumbers: boolean;
}

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["USER", "ADMIN"] }).notNull().default("USER"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  preferences: text("preferences", { mode: "json" }).$type<UserPreferences>().notNull().default({
    appTheme: "theme-midnight",
    snippetDensity: "preview",
    syntaxTheme: "github-dark",
    bgPattern: "matrix",
    showLineNumbers: true,
  }),
});

export const snippets = sqliteTable("snippets", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  tags: text("tags", { mode: "json" }).$type<string[]>(),
  authorId: text("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  visibility: text("visibility", { enum: ["PRIVATE", "SHARED", "PUBLIC"] }).notNull().default("PRIVATE"),
  shareToken: text("share_token").unique(),
  isPinned: integer("is_pinned", { mode: "boolean" }).notNull().default(false),
  expiresAt: integer("expires_at", { mode: "timestamp" }),
  collectionId: text("collection_id").references(() => collections.id, { onDelete: "set null" }),
  totalLines: integer("total_lines").notNull().default(0),
  contentHash: text("content_hash"),
  passwordHash: text("password_hash"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  deletedAt: integer("deleted_at", { mode: "timestamp" }),
  forkedFromId: text("forked_from_id"),
}, (table) => [
  index("snippet_created_at_idx").on(table.createdAt),
  index("snippet_updated_at_idx").on(table.updatedAt),
  index("snippet_author_created_at_idx").on(table.authorId, table.createdAt),
  index("snippet_visibility_idx").on(table.visibility),
  index("snippet_collection_idx").on(table.collectionId)
]);

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const siteSettings = sqliteTable("site_settings", {
  id: integer("id").primaryKey(),
  registrationEnabled: integer("registration_enabled", { mode: "boolean" }).notNull().default(true),
  globalAnnouncement: text("global_announcement"),
  maxSnippetsPerUser: integer("max_snippets_per_user").notNull().default(1000),
  maxCharsPerSnippet: integer("max_chars_per_snippet").notNull().default(250000),
});

export const collections = sqliteTable("collections", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
}, (table) => [
  index("collection_user_idx").on(table.userId)
]);

export const userFavorites = sqliteTable("user_favorites", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  snippetId: text("snippet_id").notNull().references(() => snippets.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
}, (table) => [
  index("favorite_user_idx").on(table.userId),
  index("favorite_snippet_idx").on(table.snippetId),
  uniqueIndex("favorite_user_snippet_unique").on(table.userId, table.snippetId)
]);

export const snippetFiles = sqliteTable("snippet_files", {
  id: text("id").primaryKey(),
  snippetId: text("snippet_id").notNull().references(() => snippets.id, { onDelete: "cascade" }),
  filename: text("filename").notNull(),
  code: text("code").notNull(),
  language: text("language").notNull(),
}, (table) => [
  index("file_snippet_idx").on(table.snippetId),
  index("file_language_idx").on(table.language)
]);

export const snippetRevisions = sqliteTable("snippet_revisions", {
  id: text("id").primaryKey(),
  snippetId: text("snippet_id").notNull().references(() => snippets.id, { onDelete: "cascade" }),
  content: text("content").notNull(), // JSON stringified array of files
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const siteStatistics = sqliteTable("site_statistics", {
  id: integer("id").primaryKey(),
  totalUsersCreated: integer("total_users_created").notNull().default(0),
  totalSnippetsCreated: integer("total_snippets_created").notNull().default(0),
});

export const usersRelations = relations(users, ({ many }) => ({
  snippets: many(snippets),
  sessions: many(sessions),
  collections: many(collections),
  favorites: many(userFavorites),
  apiKeys: many(apiKeys),
}));

export const collectionsRelations = relations(collections, ({ one, many }) => ({
  user: one(users, {
    fields: [collections.userId],
    references: [users.id],
  }),
  snippets: many(snippets),
}));

export const snippetsRelations = relations(snippets, ({ one, many }) => ({
  author: one(users, {
    fields: [snippets.authorId],
    references: [users.id],
  }),
  collection: one(collections, {
    fields: [snippets.collectionId],
    references: [collections.id],
  }),
  forkedFrom: one(snippets, {
    fields: [snippets.forkedFromId],
    references: [snippets.id],
    relationName: "forkedFrom",
  }),
  forks: many(snippets, {
    relationName: "forkedFrom",
  }),
  files: many(snippetFiles),
  revisions: many(snippetRevisions),
  favoritedBy: many(userFavorites),
}));

export const snippetFilesRelations = relations(snippetFiles, ({ one }) => ({
  snippet: one(snippets, {
    fields: [snippetFiles.snippetId],
    references: [snippets.id],
  }),
}));

export const snippetRevisionsRelations = relations(snippetRevisions, ({ one }) => ({
  snippet: one(snippets, {
    fields: [snippetRevisions.snippetId],
    references: [snippets.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const userFavoritesRelations = relations(userFavorites, ({ one }) => ({
  user: one(users, {
    fields: [userFavorites.userId],
    references: [users.id],
  }),
  snippet: one(snippets, {
    fields: [userFavorites.snippetId],
    references: [snippets.id],
  }),
}));

export const auditLogs = sqliteTable("audit_logs", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  action: text("action", { enum: ["CREATE", "UPDATE", "DELETE", "RESTORE", "LOGIN", "LOGOUT"] }).notNull(),
  targetType: text("target_type", { enum: ["SNIPPET", "COLLECTION", "USER", "SETTINGS"] }).notNull(),
  targetId: text("target_id"),
  details: text("details"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));

export const crashReports = sqliteTable("crash_reports", {
  id: text("id").primaryKey(),
  errorMessage: text("error_message").notNull(),
  stackTrace: text("stack_trace"),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  route: text("route"),
  metadata: text("metadata", { mode: "json" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const crashReportsRelations = relations(crashReports, ({ one }) => ({
  user: one(users, {
    fields: [crashReports.userId],
    references: [users.id],
  }),
}));

export const apiKeys = sqliteTable("api_keys", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  tokenHash: text("token_hash").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  lastUsedAt: integer("last_used_at", { mode: "timestamp" }),
}, (table) => [
  index("api_key_user_idx").on(table.userId),
  index("api_key_token_hash_idx").on(table.tokenHash),
]);

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  user: one(users, {
    fields: [apiKeys.userId],
    references: [users.id],
  }),
}));

