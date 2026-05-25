import crypto from "crypto";
import { NextResponse } from "next/server";

type ETagSource = string | number | Date | null | undefined;

export function generateETag(...sources: ETagSource[]): string {
  const normalized = sources
    .map((s) => {
      if (s instanceof Date) return s.getTime().toString();
      if (s === null || s === undefined) return "";
      return String(s);
    })
    .join("|");

  const hash = crypto.createHash("sha256").update(normalized).digest("hex");
  return `"${hash}"`;
}

export function generateETagFromData(data: unknown): string {
  const serialized = JSON.stringify(data) || "";
  const hash = crypto.createHash("sha256").update(serialized).digest("hex");
  return `"${hash}"`;
}

export function isNotModified(
  request: Request,
  etag: string
): boolean {
  const ifNoneMatch = request.headers.get("if-none-match");
  if (!ifNoneMatch) return false;
  const clientEtags = ifNoneMatch.split(",").map((t) => t.trim());
  return clientEtags.includes(etag) || clientEtags.includes("*");
}

export function notModifiedResponse(etag: string): NextResponse {
  return new NextResponse(null, {
    status: 304,
    headers: { ETag: etag },
  });
}

export function setETag(response: NextResponse, etag: string): void {
  response.headers.set("ETag", etag);
}
