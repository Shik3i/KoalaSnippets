import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

export interface UserPreferences {
  appTheme: string;
  snippetDensity: "compact" | "preview" | "full";
  syntaxTheme: string;
  bgPattern: string;
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
  passwordHash: text("password_hash"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

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
});

export const userFavorites = sqliteTable("user_favorites", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  snippetId: text("snippet_id").notNull().references(() => snippets.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const snippetFiles = sqliteTable("snippet_files", {
  id: text("id").primaryKey(),
  snippetId: text("snippet_id").notNull().references(() => snippets.id, { onDelete: "cascade" }),
  filename: text("filename").notNull(),
  code: text("code").notNull(),
  language: text("language").notNull(),
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
  files: many(snippetFiles),
  favoritedBy: many(userFavorites),
}));

export const snippetFilesRelations = relations(snippetFiles, ({ one }) => ({
  snippet: one(snippets, {
    fields: [snippetFiles.snippetId],
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
