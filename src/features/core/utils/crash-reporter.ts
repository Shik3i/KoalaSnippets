import "server-only";

import { db } from "@/db";
import { crashReports } from "@/db/schema";
import { generateId } from "@/features/auth/utils/auth";

export async function logCrash(error: unknown, route?: string, userId?: string, metadata?: Record<string, unknown>) {
  const err = error as Error & { digest?: string };
  const message = err?.message || String(error) || "Unknown error";
  const stack = err?.stack || null;
  const digest = err?.digest || null;

  console.error(`[crash] ${route ?? "unknown route"}: ${message}`);
  if (stack) console.error(`[crash] ${stack}`);

  try {
    await db.insert(crashReports).values({
      id: generateId(),
      errorMessage: digest ? `${message} (digest: ${digest})` : message,
      stackTrace: stack,
      userId: userId || null,
      route: route || null,
      metadata: metadata || null,
      createdAt: new Date(),
    }).run();
  } catch (dbErr) {
    console.error("[crash] Failed to write crash report to database:", dbErr);
  }
}

