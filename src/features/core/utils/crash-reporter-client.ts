"use client";

export async function logCrashFromClient(
  errorMessage: string,
  stackTrace?: string,
  route?: string,
  digest?: string
) {
  try {
    await fetch("/api/crash-reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ errorMessage, stackTrace, route, digest }),
    });
  } catch {
    // silently fail - don't cause recursive error loops
  }
}
