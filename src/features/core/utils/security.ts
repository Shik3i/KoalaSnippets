export function getSafePage(pageStr: string | null): number {
  if (!pageStr) return 1;
  const parsed = parseInt(pageStr, 10);
  if (isNaN(parsed) || parsed < 1) {
    return 1;
  }
  return Math.min(parsed, 1000);
}

import crypto from "crypto";

export function verifyCsrf(request: Request): boolean {
  const apiKey = request.headers.get("x-api-key");
  if (apiKey && process.env.API_KEY) {
    const bufA = Buffer.from(apiKey);
    const bufB = Buffer.from(process.env.API_KEY);
    if (bufA.byteLength === bufB.byteLength && crypto.timingSafeEqual(bufA, bufB)) {
      return true;
    }
  }

  // Simple CSRF check against Origin/Referer headers
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  
  if (!origin && !referer) {
    return false; // Block if no context is provided for mutating requests
  }

  // Ensure origin/referer matches the host
  const host = request.headers.get("host");
  if (!host) return false;
  
  try {
    const originUrl = origin ? new URL(origin) : new URL(referer!);
    return originUrl.host === host;
  } catch {
    return false;
  }
}

const htmlEntities: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
};

export function escapeHtml(str: string | null | undefined): string {
  if (!str) return "";
  return String(str).replace(/[&<>"']/g, match => htmlEntities[match]);
}
