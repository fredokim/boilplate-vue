<script setup lang="ts">
import { computed, toRef } from "vue";

import { useDashboardRenderCount, useWidgetRenderCount } from "./dashboardPerformanceMetrics";

const props = defineProps<{ selectedWidgetId: string | null; widgetCount: number }>();

const renderCount = useDashboardRenderCount();
const selectedWidgetId = toRef(props, "selectedWidgetId");
const selectedWidgetRenderCount = useWidgetRenderCount(selectedWidgetId.value);
const selectedLabel = computed(() => props.selectedWidgetId ?? "none");
</script>

<template>
  <aside class="dashboard-performance-debug" aria-label="Dashboard performance debug">
    <strong>Performance debug</strong>
    <span>Widgets: {{ widgetCount }}</span>
    <span>Dashboard renders: {{ renderCount }}</span>
    <span>Selected: {{ selectedLabel }}</span>
    <span>Selected widget renders: {{ selectedWidgetRenderCount }}</span>
  </aside>
</template>
