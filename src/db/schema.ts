import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["USER", "ADMIN"] }).notNull().default("USER"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const snippets = sqliteTable("snippets", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  code: text("code").notNull(),
  language: text("language").notNull(),
  tags: text("tags", { mode: "json" }).$type<string[]>(),
  authorId: text("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  visibility: text("visibility", { enum: ["PRIVATE", "SHARED", "PUBLIC"] }).notNull().default("PRIVATE"),
  shareToken: text("share_token").unique(),
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

export const siteStatistics = sqliteTable("site_statistics", {
  id: integer("id").primaryKey(),
  totalUsersCreated: integer("total_users_created").notNull().default(0),
  totalSnippetsCreated: integer("total_snippets_created").notNull().default(0),
});

export const usersRelations = relations(users, ({ many }) => ({
  snippets: many(snippets),
  sessions: many(sessions),
}));

export const snippetsRelations = relations(snippets, ({ one }) => ({
  author: one(users, {
    fields: [snippets.authorId],
    references: [users.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));
