<script setup lang="ts">
import { computed } from "vue";

import type { DashboardWidget } from "../model/dashboardWidget";
import { recordWidgetRender } from "../performance/dashboardPerformanceMetrics";
import type { WidgetRegistry } from "./widgetRegistry";
import WidgetErrorBoundary from "./WidgetErrorBoundary.vue";

const props = defineProps<{ registry: WidgetRegistry; widget: DashboardWidget }>();

const component = computed(() => {
  recordWidgetRender(props.widget.id);
  return props.registry.get(props.widget.type).component;
});
</script>

<template>
  <WidgetErrorBoundary>
    <Suspense>
      <component :is="component" :widget="widget" />
      <template #fallback>
        <div class="widget-data-state" role="status">Loading widget module…</div>
      </template>
    </Suspense>
  </WidgetErrorBoundary>
</template>
