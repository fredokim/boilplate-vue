<script setup lang="ts">
import { computed } from "vue";

import { BaseCheckbox, BaseInput, BaseSelect } from "@/components/atomic";
import type { AtomicOption } from "@/components/atomic/types";

import { createDataSource, type DashboardDataKind, type DashboardDataSourceId } from "../data/dashboardDataSource";
import { getDataSourceOptions } from "../data/dashboardDataSourceRegistry";
import { removeEmptyFilters } from "../model/dashboardFilters";
import type { DashboardWidget } from "../model/dashboardWidget";

const props = defineProps<{ widget: DashboardWidget }>();
const emit = defineEmits<{ change: [widget: DashboardWidget] }>();

const kindByType: Record<string, DashboardDataKind> = { kpi: "kpi", chart: "series", table: "table" };
const dataKind = computed(() => kindByType[props.widget.type]);

const sourceOptions = computed<AtomicOption[]>(() =>
  dataKind.value
    ? getDataSourceOptions(dataKind.value).map((option) => ({ label: option.label, value: option.id }))
    : [],
);

const refreshOptions: AtomicOption[] = [
  { label: "Manual", value: "manual" },
  { label: "Every 5 seconds", value: "5000" },
  { label: "Every 30 seconds", value: "30000" },
  { label: "Every minute", value: "60000" },
];

const chartTypeOptions: AtomicOption[] = [
  { label: "Line", value: "line" },
  { label: "Bar", value: "bar" },
];

const refreshValue = computed(() =>
  props.widget.dataSource.refreshPolicy?.mode === "interval"
    ? String(props.widget.dataSource.refreshPolicy.intervalMs)
    : "manual",
);

function setTitle(title: string | number | null | undefined) {
  emit("change", { ...props.widget, config: { ...props.widget.config, title: String(title ?? "") } } as DashboardWidget);
}

function setSource(sourceId: string | null | undefined) {
  if (!sourceId) return;
  emit("change", { ...props.widget, dataSource: createDataSource(sourceId as DashboardDataSourceId) });
}

function setChartType(chartType: string | null | undefined) {
  if (props.widget.type !== "chart" || !chartType) return;
  emit("change", { ...props.widget, config: { ...props.widget.config, chartType: chartType as "line" | "bar" } });
}

function setLocalProduct(product: string | number | null | undefined) {
  emit("change", {
    ...props.widget,
    localFilters: removeEmptyFilters({ ...props.widget.localFilters, product: String(product ?? "") }),
  });
}

function setRefresh(value: string | null | undefined) {
  emit("change", {
    ...props.widget,
    dataSource: {
      ...props.widget.dataSource,
      refreshPolicy:
        value === "manual" || !value
          ? { mode: "manual", staleTimeMs: 60_000 }
          : { mode: "interval", intervalMs: Number(value) as 5_000 | 30_000 | 60_000 },
    },
  });
}

function setUseGlobalFilters(useGlobalFilters: boolean) {
  emit("change", { ...props.widget, filterConfig: { ...props.widget.filterConfig, useGlobalFilters } });
}

function setAcceptCrossWidgetFilters(acceptCrossWidgetFilters: boolean) {
  emit("change", { ...props.widget, filterConfig: { ...props.widget.filterConfig, acceptCrossWidgetFilters } });
}
</script>

<template>
  <div class="grid gap-3">
    <label class="grid gap-1 text-xs font-semibold text-slate-500">
      Title
      <BaseInput :model-value="widget.config.title" aria-label="Widget title" @update:model-value="setTitle" />
    </label>
    <label v-if="dataKind" class="grid gap-1 text-xs font-semibold text-slate-500">
      Data source
      <BaseSelect
        :model-value="widget.dataSource.sourceId"
        :options="sourceOptions"
        aria-label="Data source"
        @update:model-value="setSource"
      />
    </label>
    <label v-if="widget.type === 'chart'" class="grid gap-1 text-xs font-semibold text-slate-500">
      Chart type
      <BaseSelect
        :model-value="widget.config.chartType"
        :options="chartTypeOptions"
        aria-label="Chart type"
        @update:model-value="setChartType"
      />
    </label>
    <label class="grid gap-1 text-xs font-semibold text-slate-500">
      Local product filter
      <BaseInput
        :model-value="widget.localFilters.product ?? ''"
        aria-label="Local product filter"
        @update:model-value="setLocalProduct"
      />
    </label>
    <label class="grid gap-1 text-xs font-semibold text-slate-500">
      Refresh policy
      <BaseSelect
        :model-value="refreshValue"
        :options="refreshOptions"
        aria-label="Refresh policy"
        @update:model-value="setRefresh"
      />
    </label>
    <BaseCheckbox
      :model-value="widget.filterConfig.useGlobalFilters"
      label="Use global filters"
      @update:model-value="setUseGlobalFilters"
    />
    <BaseCheckbox
      :model-value="widget.filterConfig.acceptCrossWidgetFilters"
      label="Accept cross-widget filters"
      @update:model-value="setAcceptCrossWidgetFilters"
    />
  </div>
</template>
