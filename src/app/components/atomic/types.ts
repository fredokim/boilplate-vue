export type AtomicSize = "sm" | "md" | "lg";
export type AtomicTone =
  | "neutral"
  | "primary"
  | "success"
  | "warning"
  | "error"
  | "info";
export type AtomicRadius = "sm" | "md" | "lg" | "full";
export type AtomicState = "idle" | "invalid" | "disabled" | "readonly";

export interface AtomicOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface AtomicTableColumn {
  key: string;
  label: string;
  align?: "left" | "center" | "right";
  width?: string;
}

export interface AtomicDropdownItem {
  label: string;
  value: string;
  disabled?: boolean;
  danger?: boolean;
}
