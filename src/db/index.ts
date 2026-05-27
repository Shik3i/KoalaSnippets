import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import path from "path";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as {
  conn: ReturnType<typeof drizzle> | undefined;
};

function getDb() {
  if (!globalForDb.conn) {
    const dbPath = process.env.DATABASE_URL?.replace("file:", "") ?? "./data/koalasnippets.db";
    const resolvedPath = path.resolve(process.cwd(), dbPath);
    const sqlite = new Database(resolvedPath);
    sqlite.pragma("journal_mode = WAL");
    sqlite.pragma("foreign_keys = ON");
    sqlite.pragma("busy_timeout = 5000");
    sqlite.pragma("synchronous = NORMAL");
    globalForDb.conn = drizzle(sqlite, { schema });
  }
  return globalForDb.conn;
}

export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop) {
    const database = getDb();
    return database[prop as keyof typeof database];
  },
});
