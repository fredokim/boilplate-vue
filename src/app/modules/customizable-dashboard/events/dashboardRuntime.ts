import { computed, inject, provide, toValue, type InjectionKey, type MaybeRefOrGetter } from "vue";

import type { DashboardEventBus } from "./dashboardEventBus";
import { mergeDashboardFilters, type DashboardFilterValues } from "../model/dashboardFilters";
import type { Dashboard, DashboardWidget } from "../model/dashboardWidget";

export type DashboardRuntime = {
  eventBus: DashboardEventBus;
  getEffectiveFilters: (widget: DashboardWidget) => DashboardFilterValues;
};

const runtimeKey: InjectionKey<DashboardRuntime> = Symbol("dashboard-runtime");

export function provideDashboardRuntime(dashboard: MaybeRefOrGetter<Dashboard>, eventBus: DashboardEventBus) {
  provide(runtimeKey, {
    eventBus,
    getEffectiveFilters: (widget) =>
      mergeDashboardFilters(
        widget.filterConfig.useGlobalFilters ? toValue(dashboard).globalFilters : {},
        widget.crossWidgetFilters,
        widget.localFilters,
      ),
  });
}

export function useDashboardWidgetRuntime(widget: MaybeRefOrGetter<DashboardWidget>) {
  const runtime = inject(runtimeKey, null);
  if (!runtime) {
    throw new Error("Dashboard widgets must be rendered inside a provided dashboard runtime.");
  }

  return {
    effectiveFilters: computed(() => runtime.getEffectiveFilters(toValue(widget))),
    publish: runtime.eventBus.publish,
  };
}
