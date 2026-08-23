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
