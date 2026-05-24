import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import { generateId } from "@/features/auth/utils/auth";
import { eq, desc, inArray } from "drizzle-orm";

export async function logUserAction(
  userId: string,
  action: "CREATE" | "UPDATE" | "DELETE" | "RESTORE" | "LOGIN" | "LOGOUT",
  targetType: "SNIPPET" | "COLLECTION" | "USER" | "SETTINGS",
  targetId: string | null,
  details: string | null
) {
  try {
    db.transaction((tx) => {
      tx.insert(auditLogs).values({
        id: generateId(),
        userId,
        action,
        targetType,
        targetId,
        details,
        createdAt: new Date(),
      }).run();

      const oldLogs = tx.select({ id: auditLogs.id })
        .from(auditLogs)
        .where(eq(auditLogs.userId, userId))
        .orderBy(desc(auditLogs.createdAt))
        .offset(20)
        .all();

      if (oldLogs.length > 0) {
        const idsToDelete = oldLogs.map((l) => l.id);
        tx.delete(auditLogs).where(inArray(auditLogs.id, idsToDelete)).run();
      }
    });
  } catch (err) {
    console.error("[audit] Failed to log user action:", err);
  }
}
