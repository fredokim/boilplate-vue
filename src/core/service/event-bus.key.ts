import type { InjectionKey } from "vue";

import type { AppEventBusService } from "./event-bus.service";

export const EventBusKey: InjectionKey<AppEventBusService> = Symbol("EventBus");
