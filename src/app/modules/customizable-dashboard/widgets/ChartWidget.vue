<script setup lang="ts">
import { computed } from "vue";

import type { ChartWidget as ChartWidgetModel } from "../model/dashboardWidget";
import { useWidgetData } from "../composables/useWidgetData";
import { useDashboardWidgetRuntime } from "../events/dashboardRuntime";
import WidgetDataBoundary from "./WidgetDataBoundary.vue";

const props = defineProps<{ widget: ChartWidgetModel }>();

const { effectiveFilters, publish } = useDashboardWidgetRuntime(() => props.widget);
const query = useWidgetData(() => props.widget.dataSource, "series", effectiveFilters);

const points = computed(() => query.data.value?.points ?? []);
const lastPoint = computed(() => points.value.at(-1));

// A hand-rolled SVG chart rather than a charting dependency: this repo's bundle budget
// is 190KB per chunk and the two shapes the widget needs are trivial to draw.
const VIEW = { width: 500, height: 210, left: 48, right: 12, top: 12, bottom: 32 };
const plot = computed(() => ({
  width: VIEW.width - VIEW.left - VIEW.right,
  height: VIEW.height - VIEW.top - VIEW.bottom,
}));
const maxValue = computed(() => Math.max(1, ...points.value.map((point) => point.value)));

const bars = computed(() => {
  const step = plot.value.width / Math.max(1, points.value.length);
  return points.value.map((point, index) => {
    const height = (point.value / maxValue.value) * plot.value.height;
    return {
      key: point.label,
      label: point.label,
      x: VIEW.left + index * step + step * 0.15,
      y: VIEW.top + plot.value.height - height,
      width: step * 0.7,
      height,
      labelX: VIEW.left + index * step + step / 2,
    };
  });
});

const linePath = computed(() => {
  if (points.value.length === 0) return "";
  const step = plot.value.width / Math.max(1, points.value.length - 1 || 1);
  return points.value
    .map((point, index) => {
      const x = VIEW.left + index * step;
      const y = VIEW.top + plot.value.height - (point.value / maxValue.value) * plot.value.height;
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
});

const yTicks = computed(() =>
  [0, 0.5, 1].map((ratio) => ({
    value: Math.round(maxValue.value * ratio),
    y: VIEW.top + plot.value.height - ratio * plot.value.height,
  })),
);

function filterOthers() {
  const point = lastPoint.value;
  if (!point) return;
  publish({
    type: "FilterChanged",
    sourceWidgetId: props.widget.id,
    scope: "cross-widget",
    filters: { product: point.label },
  });
}
</script>

<template>
  <div class="flex h-full flex-col">
    <p class="m-0 text-sm font-bold text-slate-900">{{ widget.config.title }}</p>
    <WidgetDataBoundary :error="query.error.value" :is-empty="points.length === 0" :is-pending="query.isPending.value">
      <div
        class="dashboard-chart mt-3 min-h-0 flex-1"
        :aria-label="`${widget.config.title} ${widget.config.chartType} chart`"
      >
        <svg :viewBox="`0 0 ${VIEW.width} ${VIEW.height}`" role="img" class="w-full">
          <g>
            <line
              v-for="tick in yTicks"
              :key="`grid-${tick.value}`"
              :x1="VIEW.left"
              :x2="VIEW.width - VIEW.right"
              :y1="tick.y"
              :y2="tick.y"
              stroke="#e2e8f0"
            />
            <text
              v-for="tick in yTicks"
              :key="`tick-${tick.value}`"
              :x="VIEW.left - 6"
              :y="tick.y + 4"
              font-size="11"
              text-anchor="end"
              fill="#64748b"
            >
              {{ tick.value }}
            </text>
          </g>
          <path v-if="widget.config.chartType === 'line'" :d="linePath" fill="none" stroke="#2563eb" stroke-width="2" />
          <rect
            v-for="bar in bars"
            v-else
            :key="bar.key"
            :x="bar.x"
            :y="bar.y"
            :width="bar.width"
            :height="bar.height"
            fill="#2563eb"
          />
          <text
            v-for="bar in bars"
            :key="`label-${bar.key}`"
            :x="bar.labelX"
            :y="VIEW.height - 10"
            font-size="11"
            text-anchor="middle"
            fill="#64748b"
          >
            {{ bar.label }}
          </text>
        </svg>
        <button v-if="lastPoint" class="dashboard-cross-filter" type="button" @click="filterOthers">
          Filter other widgets by {{ lastPoint.label }}
        </button>
      </div>
    </WidgetDataBoundary>
  </div>
</template>
