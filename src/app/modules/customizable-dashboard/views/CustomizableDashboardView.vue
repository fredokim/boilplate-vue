<script setup lang="ts">
import { computed, onMounted, onUpdated, ref } from "vue";
import { GridLayout, GridItem, type Layout } from "grid-layout-plus";

import { BaseBadge, BaseButton } from "@/components/atomic";

import type { DashboardEventBus } from "../events/dashboardEventBus";
import { removeEmptyFilters } from "../model/dashboardFilters";
import type { Dashboard, DashboardWidget, WidgetType } from "../model/dashboardWidget";
import { recordDashboardRender } from "../performance/dashboardPerformanceMetrics";
import DashboardPerformanceDebugPanel from "../performance/DashboardPerformanceDebugPanel.vue";
import type { WidgetRegistry } from "../widgets/widgetRegistry";
import WidgetRenderer from "../widgets/WidgetRenderer.vue";
import "./customizableDashboard.scss";

const props = withDefaults(
  defineProps<{
    dashboard: Dashboard;
    registry: WidgetRegistry;
    permissions: { canEdit: boolean; canExport: boolean; canImport: boolean };
    showPerformanceDebug?: boolean;
    eventBus: DashboardEventBus;
    canUndo: boolean;
    canRedo: boolean;
    importError: string | null;
    isEditing: boolean;
    isSaving: boolean;
    selectedWidgetId: string | null;
    saveError: string | null;
  }>(),
  { showPerformanceDebug: false }
);

const emit = defineEmits<{
  addWidget: [type: WidgetType];
  cancel: [];
  deleteWidget: [widgetId: string];
  edit: [];
  layoutChange: [layout: { id: string; position: { x: number; y: number }; width: number; height: number }[]];
  save: [];
  widgetChange: [widget: DashboardWidget];
  importDashboard: [serialized: string];
  exportDashboard: [receiver: { value: string | undefined }];
  undo: [];
  redo: [];
}>();

const fileInput = ref<HTMLInputElement | null>(null);

onMounted(recordDashboardRender);
onUpdated(recordDashboardRender);

const layout = computed<Layout>(() =>
  props.dashboard.widgets.map((widget) => ({
    i: widget.id,
    x: widget.position.x,
    y: widget.position.y,
    w: widget.width,
    h: widget.height,
    minW: 2,
    minH: 2,
    isResizable: props.registry.get(widget.type).capabilities.resizable,
  }))
);

const draggable = computed(() => props.permissions.canEdit && props.isEditing && !props.isSaving);

function onLayoutUpdated(next: Layout) {
  emit(
    "layoutChange",
    next.map((item) => ({ id: item.i as string, position: { x: item.x, y: item.y }, width: item.w, height: item.h }))
  );
}

function updateGlobalFilter(key: "dateFrom" | "dateTo" | "region" | "product", value: string) {
  props.eventBus.publish({
    type: "FilterChanged",
    sourceWidgetId: null,
    scope: "global",
    filters: removeEmptyFilters({ ...props.dashboard.globalFilters, [key]: value }),
  });
}

function downloadDashboard() {
  const receiver: { value: string | undefined } = { value: undefined };
  emit("exportDashboard", receiver);
  if (!receiver.value) return;
  const url = URL.createObjectURL(new Blob([receiver.value], { type: "application/json" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "dashboard.json";
  anchor.click();
  URL.revokeObjectURL(url);
}

function onImportFile(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file) void file.text().then((text) => emit("importDashboard", text));
  input.value = "";
}
</script>

<template>
  <div class="grid gap-5">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <div class="flex items-center gap-2">
          <h1 class="m-0 text-2xl font-black text-slate-900">Customizable Dashboard</h1>
          <BaseBadge v-if="isEditing" tone="info">Editing draft</BaseBadge>
        </div>
        <p class="mt-2 text-sm text-slate-600">
          {{ isEditing ? "Changes remain in a draft until you save." : "View mode prevents accidental layout changes." }}
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <BaseButton v-if="permissions.canExport" variant="outline" @click="downloadDashboard">Export JSON</BaseButton>
        <template v-if="isEditing">
          <BaseButton variant="outline" :disabled="!canUndo || isSaving" @click="emit('undo')">Undo</BaseButton>
          <BaseButton variant="outline" :disabled="!canRedo || isSaving" @click="emit('redo')">Redo</BaseButton>
          <label v-if="permissions.canImport" class="dashboard-import-button">
            Import JSON
            <input ref="fileInput" accept="application/json" type="file" @change="onImportFile" />
          </label>
          <BaseButton variant="outline" :disabled="isSaving" @click="emit('cancel')">Cancel</BaseButton>
          <BaseButton :disabled="isSaving" @click="emit('save')">{{ isSaving ? "Saving…" : "Save" }}</BaseButton>
        </template>
        <BaseButton v-else-if="permissions.canEdit" @click="emit('edit')">Edit dashboard</BaseButton>
      </div>
    </div>

    <div v-if="saveError || importError" class="dashboard-save-error" role="alert">
      {{ saveError ?? importError }}
    </div>

    <section class="dashboard-global-filters" aria-label="Global filters">
      <strong class="text-sm text-slate-900">Global filters</strong>
      <label>
        From
        <input
          type="date"
          :value="dashboard.globalFilters.dateFrom ?? ''"
          @input="updateGlobalFilter('dateFrom', ($event.target as HTMLInputElement).value)"
        />
      </label>
      <label>
        To
        <input
          type="date"
          :value="dashboard.globalFilters.dateTo ?? ''"
          @input="updateGlobalFilter('dateTo', ($event.target as HTMLInputElement).value)"
        />
      </label>
      <label>
        Region
        <select
          :value="dashboard.globalFilters.region ?? ''"
          @change="updateGlobalFilter('region', ($event.target as HTMLSelectElement).value)"
        >
          <option value="">All</option>
          <option value="americas">Americas</option>
          <option value="emea">EMEA</option>
          <option value="apac">APAC</option>
        </select>
      </label>
      <label>
        Product
        <input
          placeholder="All products"
          :value="dashboard.globalFilters.product ?? ''"
          @input="updateGlobalFilter('product', ($event.target as HTMLInputElement).value)"
        />
      </label>
      <BaseButton size="sm" variant="outline" @click="eventBus.publish({ type: 'RefreshRequested' })">
        Refresh all
      </BaseButton>
    </section>

    <section v-if="isEditing" class="dashboard-toolbar" aria-label="Widget picker">
      <strong class="text-sm text-slate-900">Add widget</strong>
      <div class="flex flex-wrap gap-2">
        <BaseButton
          v-for="item in registry.getPickerItems()"
          :key="item.type"
          size="sm"
          variant="outline"
          @click="emit('addWidget', item.type)"
        >
          + {{ item.label }}
        </BaseButton>
      </div>
    </section>

    <div class="dashboard-grid-container">
      <GridLayout
        :col-num="12"
        :is-draggable="draggable"
        :is-resizable="draggable"
        :layout="layout"
        :margin="[16, 16]"
        :row-height="52"
        @layout-updated="onLayoutUpdated"
      >
        <GridItem
          v-for="widget in dashboard.widgets"
          :key="widget.id"
          :h="widget.height"
          :i="widget.id"
          drag-allow-from=".dashboard-widget__handle"
          drag-ignore-from=".dashboard-widget__action"
          :w="widget.width"
          :x="widget.position.x"
          :y="widget.position.y"
        >
          <article
            class="dashboard-widget h-full"
            :class="selectedWidgetId === widget.id ? 'dashboard-widget--selected' : ''"
            @click="eventBus.publish({ type: 'WidgetSelected', widgetId: widget.id })"
          >
            <div class="dashboard-widget__header" :class="isEditing ? 'dashboard-widget__handle' : ''">
              <div class="flex items-center gap-2">
                <span>{{ registry.get(widget.type).displayName }}</span>
                <span v-if="widget.localFilters.product" class="dashboard-filter-badge">
                  Local: {{ widget.localFilters.product }}
                </span>
                <span v-if="widget.crossWidgetFilters.product" class="dashboard-filter-badge">
                  Cross: {{ widget.crossWidgetFilters.product }}
                </span>
                <span v-if="widget.dataSource.refreshPolicy?.mode === 'interval'" class="dashboard-filter-badge">
                  Every {{ (widget.dataSource.refreshPolicy.intervalMs ?? 0) / 1000 }}s
                </span>
              </div>
              <button
                v-if="isEditing"
                :aria-label="`Delete ${widget.config.title}`"
                class="dashboard-widget__action"
                type="button"
                @click="emit('deleteWidget', widget.id)"
              >
                Delete
              </button>
              <button
                v-else-if="registry.get(widget.type).capabilities.refreshable"
                :aria-label="`Refresh ${widget.config.title}`"
                class="dashboard-widget__action"
                type="button"
                @click.stop="eventBus.publish({ type: 'RefreshRequested', widgetId: widget.id })"
              >
                Refresh
              </button>
            </div>
            <div class="dashboard-widget__content">
              <WidgetRenderer :registry="registry" :widget="widget" />
            </div>
          </article>
        </GridItem>
      </GridLayout>
    </div>

    <section v-if="isEditing && dashboard.widgets.length > 0" class="dashboard-settings" aria-label="Widget settings">
      <div>
        <h2 class="m-0 text-lg font-bold text-slate-900">Widget settings</h2>
        <p class="mb-0 mt-1 text-sm text-slate-600">Each widget definition supplies its own editor.</p>
      </div>
      <div class="dashboard-settings__grid">
        <div v-for="widget in dashboard.widgets" :key="widget.id" class="dashboard-settings__item">
          <strong class="text-sm text-slate-900">{{ widget.config.title }}</strong>
          <component
            :is="registry.get(widget.type).configEditor"
            v-if="registry.get(widget.type).configEditor"
            :widget="widget"
            @change="emit('widgetChange', $event)"
          />
        </div>
      </div>
    </section>

    <DashboardPerformanceDebugPanel
      v-if="showPerformanceDebug"
      :selected-widget-id="selectedWidgetId"
      :widget-count="dashboard.widgets.length"
    />
  </div>
</template>
