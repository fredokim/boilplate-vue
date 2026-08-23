import type { Component } from "vue";
import { inject } from "vue";

import { EventBusKey } from "@core/service/event-bus.key";
import type { AppEventBusService } from "@core/service/event-bus.service";
import type { AppEventMap } from "@core/service/event-bus.types";

export function useEventBus(): AppEventBusService {
  const bus = inject(EventBusKey);

  if (!bus) {
    throw new Error("EventBusService is not provided.");
  }

  return bus;
}

export function useAlert() {
  const bus = useEventBus();

  return (
    message: string,
    type: AppEventMap["alert"]["type"] = "info",
    duration = 3000
  ) => {
    bus.alert({ message, type, duration });
  };
}

export function useConfirm() {
  const bus = useEventBus();

  return (
    message: string,
    onConfirm: () => void,
    onCancel?: () => void,
    confirmText = "Confirm",
    cancelText = "Cancel"
  ) => {
    bus.confirm({ message, onConfirm, onCancel, confirmText, cancelText });
  };
}

export function useDialog() {
  const bus = useEventBus();

  return (component: Component, props?: Record<string, unknown>) => {
    bus.dialog({ component, props });
  };
}
