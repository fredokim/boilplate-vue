import { computed, onScopeDispose, shallowRef, toValue, watch, type MaybeRefOrGetter, type ShallowRef } from "vue";

import {
  dashboardDataSourceQueryKey,
  type DashboardData,
  type KpiData,
  type SeriesData,
  type TableData,
  type WidgetDataSource,
} from "../data/dashboardDataSource";
import type { DashboardFilterValues } from "../model/dashboardFilters";
import { useDashboardDataSourceRegistry } from "../data/dashboardDataSourceRegistry.provide";
import { widgetDataCache } from "./widgetDataCache";

type WidgetQuery<TData> = {
  data: ShallowRef<TData | undefined>;
  error: ShallowRef<Error | null>;
  isPending: ShallowRef<boolean>;
  refresh: () => void;
};

export function useWidgetData(
  dataSource: MaybeRefOrGetter<WidgetDataSource>,
  expectedKind: "kpi",
  filters?: MaybeRefOrGetter<DashboardFilterValues>,
): WidgetQuery<KpiData>;
export function useWidgetData(
  dataSource: MaybeRefOrGetter<WidgetDataSource>,
  expectedKind: "series",
  filters?: MaybeRefOrGetter<DashboardFilterValues>,
): WidgetQuery<SeriesData>;
export function useWidgetData(
  dataSource: MaybeRefOrGetter<WidgetDataSource>,
  expectedKind: "table",
  filters?: MaybeRefOrGetter<DashboardFilterValues>,
): WidgetQuery<TableData>;
export function useWidgetData(
  dataSource: MaybeRefOrGetter<WidgetDataSource>,
  expectedKind: DashboardData["kind"],
  filters?: MaybeRefOrGetter<DashboardFilterValues>,
) {
  const registry = useDashboardDataSourceRegistry();

  const effectiveDataSource = computed(() => {
    const source = toValue(dataSource);
    return { ...source, parameters: { ...source.parameters, ...(toValue(filters) ?? {}) } };
  });
  const queryKey = computed(() => dashboardDataSourceQueryKey(effectiveDataSource.value).join("|"));

  const data = shallowRef<DashboardData | undefined>(undefined);
  const error = shallowRef<Error | null>(null);
  const isPending = shallowRef(true);

  function sync() {
    const snapshot = widgetDataCache.read(queryKey.value);
    data.value = snapshot.data;
    error.value = snapshot.error ?? null;
    isPending.value = snapshot.isPending;
  }

  function load() {
    const source = effectiveDataSource.value;
    const definition = registry[source.sourceId];
    const staleTime = source.refreshPolicy?.staleTimeMs ?? 0;
    void widgetDataCache
      .fetch(
        queryKey.value,
        async () => {
          const loaded = await definition.load(source.parameters);
          if (loaded.kind !== expectedKind) {
            throw new Error(`Data source ${definition.id} returned ${loaded.kind}; expected ${expectedKind}.`);
          }
          return loaded;
        },
        staleTime,
      )
      .catch(() => undefined)
      .finally(sync);
    sync();
  }

  let unsubscribe = () => {};
  let intervalTimer: ReturnType<typeof setInterval> | undefined;

  watch(
    queryKey,
    () => {
      unsubscribe();
      unsubscribe = widgetDataCache.subscribe(queryKey.value, sync);

      if (intervalTimer) clearInterval(intervalTimer);
      const policy = toValue(dataSource).refreshPolicy;
      if (policy?.mode === "interval" && policy.intervalMs) {
        intervalTimer = setInterval(() => {
          widgetDataCache.invalidate(queryKey.value);
          load();
        }, policy.intervalMs);
      }

      load();
    },
    { immediate: true },
  );

  onScopeDispose(() => {
    if (intervalTimer) clearInterval(intervalTimer);
    unsubscribe();
  });

  return {
    data,
    error,
    isPending,
    refresh: () => {
      widgetDataCache.invalidate(queryKey.value);
      load();
    },
  };
}
