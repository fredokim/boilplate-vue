export type LoadState = "idle" | "loading" | "success" | "error";

export interface StoreFailure {
  message: string;
  code?: string;
  origin?: "frontend" | "backend";
  kind?: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  /** The server sends permissions, not role names. */
  permissions: string[];
}

export interface BreadcrumbItem {
  label: string;
  to?: string;
}
