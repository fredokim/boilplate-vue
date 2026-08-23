<script setup lang="ts">
import { computed } from "vue";

import type { KpiWidget as KpiWidgetModel } from "../model/dashboardWidget";
import { useWidgetData } from "../composables/useWidgetData";
import { useDashboardWidgetRuntime } from "../events/dashboardRuntime";
import WidgetDataBoundary from "./WidgetDataBoundary.vue";

const props = defineProps<{ widget: KpiWidgetModel }>();

const { effectiveFilters } = useDashboardWidgetRuntime(() => props.widget);
const query = useWidgetData(() => props.widget.dataSource, "kpi", effectiveFilters);
const isEmpty = computed(() => query.data.value?.value === undefined);
</script>

<template>
  <div class="flex h-full flex-col">
    <p class="m-0 text-sm font-semibold text-slate-500">{{ widget.config.title }}</p>
    <WidgetDataBoundary :error="query.error.value" :is-empty="isEmpty" :is-pending="query.isPending.value">
      <div class="mt-auto">
        <p class="m-0 text-xs font-semibold text-slate-500">{{ query.data.value?.label }}</p>
        <p class="mb-0 mt-1 text-3xl font-black text-slate-900">{{ query.data.value?.value?.toLocaleString() }}</p>
        <p v-if="query.data.value?.trend" class="mb-0 mt-2 text-sm font-semibold text-emerald-600">
          {{ query.data.value.trend }}
        </p>
      </div>
    </WidgetDataBoundary>
  </div>
</template>
