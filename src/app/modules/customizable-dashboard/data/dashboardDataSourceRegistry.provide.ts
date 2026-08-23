import { inject, provide, type InjectionKey } from "vue";

import { dashboardDataSourceRegistry, type DashboardDataSourceRegistry } from "./dashboardDataSourceRegistry";

const registryKey: InjectionKey<DashboardDataSourceRegistry> = Symbol("dashboard-data-source-registry");

export function provideDashboardDataSourceRegistry(registry: DashboardDataSourceRegistry) {
  provide(registryKey, registry);
}

export function useDashboardDataSourceRegistry(): DashboardDataSourceRegistry {
  return inject(registryKey, dashboardDataSourceRegistry);
}
