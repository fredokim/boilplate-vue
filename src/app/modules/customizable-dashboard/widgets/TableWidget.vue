<script setup lang="ts">
import { computed, ref } from "vue";
import { useVirtualizer } from "@tanstack/vue-virtual";

import type { TableWidget as TableWidgetModel } from "../model/dashboardWidget";
import { useWidgetData } from "../composables/useWidgetData";
import { useDashboardWidgetRuntime } from "../events/dashboardRuntime";
import WidgetDataBoundary from "./WidgetDataBoundary.vue";

const props = defineProps<{ widget: TableWidgetModel }>();

const { effectiveFilters, publish } = useDashboardWidgetRuntime(() => props.widget);
const query = useWidgetData(() => props.widget.dataSource, "table", effectiveFilters);

const rows = computed(() => query.data.value?.rows ?? []);
const scrollElement = ref<HTMLElement | null>(null);

const rowVirtualizer = useVirtualizer(
  computed(() => ({
    count: rows.value.length,
    estimateSize: () => 36,
    getItemKey: (index: number) => rows.value[index]?.id ?? index,
    getScrollElement: () => scrollElement.value,
    initialRect: { width: 800, height: 220 },
    observeElementRect: (_instance: unknown, callback: (rect: { width: number; height: number }) => void) => {
      const element = scrollElement.value;
      callback({ width: element && element.clientWidth > 0 ? element.clientWidth : 800, height: 220 });
      return () => undefined;
    },
    overscan: 3,
  })),
);

const virtualRows = computed(() => rowVirtualizer.value.getVirtualItems());

function filterDashboard(event: string) {
  publish({ type: "FilterChanged", sourceWidgetId: props.widget.id, scope: "cross-widget", filters: { product: event } });
}
</script>

<template>
  <div class="flex h-full flex-col">
    <p class="m-0 text-sm font-bold text-slate-900">{{ widget.config.title }}</p>
    <WidgetDataBoundary @retry="() => query.refresh()" :error="query.error.value" :is-empty="rows.length === 0" :is-pending="query.isPending.value">
      <div class="mt-3">
        <div class="dashboard-virtual-table__header text-xs text-slate-500">
          <strong v-for="column in query.data.value?.columns" :key="column.key">{{ column.label }}</strong>
          <strong>Interaction</strong>
        </div>
        <div ref="scrollElement" class="dashboard-virtual-table" :data-rendered-row-count="virtualRows.length">
          <div class="dashboard-virtual-table__body" :style="{ height: `${rowVirtualizer.getTotalSize()}px` }">
            <template v-for="virtualRow in virtualRows" :key="virtualRow.key">
              <div
                v-if="rows[virtualRow.index]"
                class="dashboard-virtual-table__row text-xs"
                :data-index="virtualRow.index"
                :style="{ height: `${virtualRow.size}px`, transform: `translateY(${virtualRow.start}px)` }"
              >
                <span v-for="column in query.data.value?.columns" :key="column.key" class="text-slate-900">
                  {{ rows[virtualRow.index]?.[column.key] }}
                </span>
                <span>
                  <button
                    class="dashboard-cross-filter"
                    type="button"
                    @click="filterDashboard(rows[virtualRow.index]?.event ?? '')"
                  >
                    Filter dashboard
                  </button>
                </span>
              </div>
            </template>
          </div>
        </div>
        <p class="dashboard-virtual-table__debug">Rendered rows: {{ virtualRows.length }} / {{ rows.length }}</p>
      </div>
    </WidgetDataBoundary>
  </div>
</template>
