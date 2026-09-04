import type { ValidationError } from "class-validator";

export type ApiErrorOrigin = "frontend" | "backend";

export type ApiErrorKind =
  | "network"
  | "request_setup"
  | "http_status"
  | "business_status"
  | "response_contract"
  | "unknown";

export interface ApiErrorContext {
  method?: string;
  url?: string;
  status?: number;
  code?: string;
  validationErrors?: ValidationError[];
  raw?: unknown;
  cause?: unknown;
}

export class TypedApiError extends Error {
  readonly origin: ApiErrorOrigin;
  readonly kind: ApiErrorKind;
  readonly context: ApiErrorContext;

  constructor(
    origin: ApiErrorOrigin,
    kind: ApiErrorKind,
    message: string,
    context: ApiErrorContext = {}
  ) {
    super(message);
    this.name = "TypedApiError";
    this.origin = origin;
    this.kind = kind;
    this.context = context;
  }
}

export function isTypedApiError(error: unknown): error is TypedApiError {
  return error instanceof TypedApiError;
}

/**
 * Whether a failure means "not signed in".
 *
 * The backend uses one code for it — `AUTH_REQUIRED` — covering a missing,
 * expired, or invalid access token. It is a separate question from a 403, which
 * means signed in but not allowed, and callers that conflate the two either
 * sign a user out for lacking a permission or leave them staring at a screen
 * that will never load.
 *
 * The status is checked as well, because a network layer that never reached the
 * envelope has no code to report.
 */
export function isAuthRequired(error: unknown): boolean {
  if (!(error instanceof TypedApiError)) return false;

  return error.context.code === "AUTH_REQUIRED" || error.context.status === 401;
}
