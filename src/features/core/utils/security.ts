export function getSafePage(pageStr: string | null): number {
  if (!pageStr) return 1;
  const parsed = parseInt(pageStr, 10);
  if (isNaN(parsed) || parsed < 1) {
    return 1;
  }
  return parsed;
}

export function verifyCsrf(request: Request): boolean {
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

export function escapeHtml(str: string): string {
  return str.replace(/[&<>"']/g, match => htmlEntities[match]);
}
