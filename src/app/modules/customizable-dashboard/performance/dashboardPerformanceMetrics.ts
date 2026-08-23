import { onScopeDispose, ref, type Ref } from "vue";

let dashboardRenderCount = 0;
const widgetRenderCounts = new Map<string, number>();
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function recordDashboardRender() {
  dashboardRenderCount += 1;
  emit();
}

export function recordWidgetRender(widgetId: string) {
  widgetRenderCounts.set(widgetId, (widgetRenderCounts.get(widgetId) ?? 0) + 1);
  emit();
}

export function resetDashboardPerformanceMetrics() {
  dashboardRenderCount = 0;
  widgetRenderCounts.clear();
  emit();
}

function useMetric(read: () => number): Ref<number> {
  const value = ref(read());
  const listener = () => {
    value.value = read();
  };
  listeners.add(listener);
  onScopeDispose(() => listeners.delete(listener));
  return value;
}

export function useDashboardRenderCount() {
  return useMetric(() => dashboardRenderCount);
}

export function useWidgetRenderCount(widgetId: string | null) {
  return useMetric(() => (widgetId ? (widgetRenderCounts.get(widgetId) ?? 0) : 0));
}
