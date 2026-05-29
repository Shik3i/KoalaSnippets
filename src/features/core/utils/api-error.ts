import { NextResponse } from "next/server";

export const VALIDATION_ERROR = "VALIDATION_ERROR" as const;
export const UNAUTHORIZED = "UNAUTHORIZED" as const;
export const FORBIDDEN = "FORBIDDEN" as const;
export const NOT_FOUND = "NOT_FOUND" as const;
export const RATE_LIMITED = "RATE_LIMITED" as const;
export const INTERNAL_ERROR = "INTERNAL_ERROR" as const;
export const DUPLICATE = "DUPLICATE" as const;
export const CSRF_ERROR = "CSRF_ERROR" as const;
export const PAYLOAD_TOO_LARGE = "PAYLOAD_TOO_LARGE" as const;

export type ErrorCode =
  | typeof VALIDATION_ERROR
  | typeof UNAUTHORIZED
  | typeof FORBIDDEN
  | typeof NOT_FOUND
  | typeof RATE_LIMITED
  | typeof INTERNAL_ERROR
  | typeof DUPLICATE
  | typeof CSRF_ERROR
  | typeof PAYLOAD_TOO_LARGE;

const STATUS_MAP: Record<ErrorCode, number> = {
  [VALIDATION_ERROR]: 400,
  [UNAUTHORIZED]: 401,
  [FORBIDDEN]: 403,
  [NOT_FOUND]: 404,
  [RATE_LIMITED]: 429,
  [INTERNAL_ERROR]: 500,
  [DUPLICATE]: 409,
  [CSRF_ERROR]: 403,
  [PAYLOAD_TOO_LARGE]: 413,
};

export function createErrorResponse(
  code: ErrorCode,
  message: string,
  extras?: Record<string, unknown>,
): NextResponse {
  const status = STATUS_MAP[code];
  return NextResponse.json(
    { error: { code, message, ...extras } },
    { status },
  );
}
