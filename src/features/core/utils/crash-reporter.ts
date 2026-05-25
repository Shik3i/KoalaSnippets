import "server-only";

import { db } from "@/db";
import { crashReports } from "@/db/schema";
import { generateId } from "@/features/auth/utils/auth";

export async function logCrash(error: any, route?: string, userId?: string, metadata?: Record<string, unknown>) {
  const message = error?.message || String(error) || "Unknown error";
  const stack = error?.stack || null;
  const digest = error?.digest || null;

  console.error(`[crash] ${route ?? "unknown route"}: ${message}`);
  if (stack) console.error(`[crash] ${stack}`);

  try {
    await db.insert(crashReports).values({
      id: generateId(),
      errorMessage: digest ? `${message} (digest: ${digest})` : message,
      stackTrace: stack,
      userId: userId || null,
      route: route || null,
      metadata: metadata ? (() => {
        try {
          return JSON.stringify(metadata);
        } catch {
          return '{"error":"Circular or invalid JSON metadata"}';
        }
      })() : null,
      createdAt: new Date(),
    }).run();
  } catch (dbErr) {
    console.error("[crash] Failed to write crash report to database:", dbErr);
  }
}

