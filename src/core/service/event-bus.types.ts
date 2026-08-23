import type { Component } from "vue";

export type EventCallback<TPayload> = (payload: TPayload) => void;
export type Unsubscribe = () => void;

export interface AppEventMap extends Record<PropertyKey, unknown> {
  alert: {
    message: string;
    type?: "success" | "error" | "info" | "warning";
    variant?: "basic" | "filled" | "outlined";
    duration?: number;
  };
  confirm: {
    message: string;
    onConfirm: () => void;
    onCancel?: () => void;
    confirmText?: string;
    cancelText?: string;
    title?: string;
  };
  dialog: {
    component: Component;
    props?: Record<string, unknown>;
    title?: string;
  };
}
