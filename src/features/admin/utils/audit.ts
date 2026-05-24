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
    await db.insert(auditLogs).values({
      id: generateId(),
      userId,
      action,
      targetType,
      targetId,
      details,
      createdAt: new Date(),
    });

    // Keep only the last 20 actions for this specific user
    const oldLogs = await db.select({ id: auditLogs.id })
      .from(auditLogs)
      .where(eq(auditLogs.userId, userId))
      .orderBy(desc(auditLogs.createdAt))
      .offset(20)
      .all();

    if (oldLogs.length > 0) {
      const idsToDelete = oldLogs.map((l) => l.id);
      await db.delete(auditLogs).where(inArray(auditLogs.id, idsToDelete));
    }
  } catch (err) {
    console.error("[audit] Failed to log user action:", err);
  }
}
