<script setup lang="ts">
import { computed } from "vue";

import CustomizableDashboardView from "../views/CustomizableDashboardView.vue";
import DashboardPersonalizationToolbar from "../personalization/DashboardPersonalizationToolbar.vue";
import { createDashboardEventBus } from "../events/dashboardEventBus";
import { provideDashboardRuntime } from "../events/dashboardRuntime";
import { provideDashboardDataSourceRegistry } from "../data/dashboardDataSourceRegistry.provide";
import { dashboardDataSourceRegistry, type DashboardDataSourceRegistry } from "../data/dashboardDataSourceRegistry";
import { useDashboardBuilder } from "../composables/useDashboardBuilder";
import { useDashboardPersonalization } from "../composables/useDashboardPersonalization";
import { initialDashboard as defaultDashboard } from "../model/initialDashboard";
import { exportDashboard } from "../model/dashboardSerialization";
import type { Dashboard } from "../model/dashboardWidget";
import { createDashboardActionGate, type DashboardRole } from "../permissions/dashboardPermissions";
import type { DashboardRepository } from "../persistence/dashboardRepository";
import {
  createLocalStorageDashboardPersonalizationRepository,
  createPersonalizedDashboardRepository,
  type DashboardPersonalizationRepository,
} from "../personalization/dashboardPersonalizationRepository";
import { defaultWidgetRegistry, type WidgetRegistry } from "../widgets/widgetRegistry";

const props = withDefaults(
  defineProps<{
    initialDashboard?: Dashboard;
    repository?: DashboardRepository;
    registry?: WidgetRegistry;
    dataSourceRegistry?: DashboardDataSourceRegistry;
    role?: DashboardRole;
    initiallyEditing?: boolean;
    showPerformanceDebug?: boolean;
    personalizationUserId?: string;
    personalizationRepository?: DashboardPersonalizationRepository;
  }>(),
  {
    initialDashboard: () => defaultDashboard,
    role: "editor",
    initiallyEditing: false,
    showPerformanceDebug: false,
    personalizationUserId: "demo-user",
  }
);

const registry = computed(() => props.registry ?? defaultWidgetRegistry);
const eventBus = createDashboardEventBus();
const actionGate = createDashboardActionGate(props.role);

provideDashboardDataSourceRegistry(props.dataSourceRegistry ?? dashboardDataSourceRegistry);

// A dashboard driven straight from an injected repository skips personalization; that is
// how the stories and tests exercise the builder without preset bookkeeping.
const personalizationRepository =
  props.personalizationRepository ??
  (props.repository ? null : createLocalStorageDashboardPersonalizationRepository(window.localStorage));

const personalization = personalizationRepository
  ? useDashboardPersonalization(personalizationRepository, props.personalizationUserId, props.initialDashboard.metadata.id)
  : null;

const activePreset = computed(() => {
  if (!personalization) return null;
  const current = personalization.personalization.value;
  return current.presets.find((preset) => preset.id === current.activePresetId) ?? current.presets[0] ?? null;
});

const repository = computed<DashboardRepository>(() => {
  if (props.repository) return props.repository;
  const preset = activePreset.value;
  if (!personalization || !preset || !personalizationRepository) {
    throw new Error("At least one dashboard preset is required.");
  }
  return createPersonalizedDashboardRepository(
    props.initialDashboard,
    personalization.personalization.value,
    preset.id,
    personalizationRepository,
    personalization.replacePersonalization
  );
});

const builder = useDashboardBuilder({
  initialDashboard: props.initialDashboard,
  initiallyEditing: props.initiallyEditing,
  repository: repository.value,
  eventBus,
  actionGate,
  registry: registry.value,
});

provideDashboardRuntime(() => builder.dashboard.value, eventBus);

const permissions = computed(() => ({
  canEdit: actionGate.can("edit"),
  canExport: actionGate.can("export"),
  canImport: actionGate.can("import"),
}));

function onExportDashboard(receiver: { value: string | undefined }) {
  receiver.value = exportDashboard(builder.dashboard.value);
}
</script>

<template>
  <div class="dashboard-personalization-shell">
    <DashboardPersonalizationToolbar
      v-if="personalization && activePreset"
      :error="personalization.error.value"
      :personalization="personalization.personalization.value"
      @create="personalization.createPreset"
      @delete="personalization.deleteActivePreset"
      @export="(receiver) => (receiver.value = personalization!.exportJson())"
      @import="personalization.importJson"
      @reset="personalization.resetActivePreset"
      @select="personalization.selectPreset"
    />
    <CustomizableDashboardView
      :can-redo="builder.canRedo.value"
      :can-undo="builder.canUndo.value"
      :dashboard="builder.dashboard.value"
      :event-bus="eventBus"
      :import-error="builder.importError.value"
      :is-editing="builder.isEditing.value"
      :is-saving="builder.isSaving.value"
      :permissions="permissions"
      :registry="registry"
      :save-error="builder.saveError.value"
      :selected-widget-id="builder.selectedWidgetId.value"
      :show-performance-debug="showPerformanceDebug"
      @add-widget="builder.addWidget"
      @cancel="builder.cancel"
      @delete-widget="builder.deleteWidget"
      @edit="builder.enterEditMode"
      @export-dashboard="onExportDashboard"
      @import-dashboard="builder.importJson"
      @layout-change="builder.updateLayout"
      @redo="builder.redo"
      @save="builder.save"
      @undo="builder.undo"
      @widget-change="builder.updateWidget"
    />
  </div>
</template>
