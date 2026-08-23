import mitt from "mitt";
import type { Emitter } from "mitt";

import type { AppEventMap, EventCallback, Unsubscribe } from "./event-bus.types";

export class EventBusService<TEvents extends Record<PropertyKey, unknown> = AppEventMap> {
  private readonly emitter: Emitter<TEvents>;

  constructor(emitter: Emitter<TEvents> = mitt<TEvents>()) {
    this.emitter = emitter;
  }

  emit<TKey extends keyof TEvents>(type: TKey, payload: TEvents[TKey]) {
    this.emitter.emit(type, payload);
  }

  on<TKey extends keyof TEvents>(
    type: TKey,
    callback: EventCallback<TEvents[TKey]>
  ): Unsubscribe {
    this.emitter.on(type, callback);

    return () => {
      this.off(type, callback);
    };
  }

  off<TKey extends keyof TEvents>(
    type: TKey,
    callback: EventCallback<TEvents[TKey]>
  ) {
    this.emitter.off(type, callback);
  }
}

export class AppEventBusService extends EventBusService<AppEventMap> {
  alert(payload: AppEventMap["alert"]) {
    this.emit("alert", payload);
  }

  confirm(payload: AppEventMap["confirm"]) {
    this.emit("confirm", payload);
  }

  dialog(payload: AppEventMap["dialog"]) {
    this.emit("dialog", payload);
  }
}

export const appEventBus = new AppEventBusService();
