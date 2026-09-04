import { computed, onScopeDispose, ref, shallowRef } from "vue";

import {
  addDraftWidget,
  applyCrossWidgetFilters,
  cancelDashboardDraft,
  createDashboardBuilderState,
  deleteDraftWidget,
  enterDashboardEditMode,
  getVisibleDashboard,
  importDashboardDraft,
  redoDashboardDraft,
  replaceDraftWidget,
  undoDashboardDraft,
  updateDraftLayout,
  updateGlobalFilters,
  updateLocalFilters,
} from "../model/dashboardBuilder";
import { dashboardDataSourceQueryKey } from "../data/dashboardDataSource";
import type { DashboardEventBus } from "../events/dashboardEventBus";
import { mergeDashboardFilters } from "../model/dashboardFilters";
import { importDashboard } from "../model/dashboardSerialization";
import type { Dashboard, DashboardLayoutItem, DashboardWidget, WidgetType } from "../model/dashboardWidget";
import type { DashboardActionGate } from "../permissions/dashboardPermissions";
import { persistDashboardDraft } from "../persistence/saveDashboardDraft";
import type { DashboardRepository } from "../persistence/dashboardRepository";
import { createWidget, type WidgetRegistry } from "../widgets/widgetRegistry";
import { widgetDataCache } from "./widgetDataCache";

type UseDashboardBuilderOptions = {
  initialDashboard: Dashboard;
  initiallyEditing?: boolean;
  repository: DashboardRepository;
  eventBus: DashboardEventBus;
  actionGate: DashboardActionGate;
  registry: WidgetRegistry;
};

function createWidgetId(type: WidgetType): string {
  return `${type}-${crypto.randomUUID()}`;
}

export function useDashboardBuilder({
  actionGate,
  eventBus,
  initialDashboard,
  initiallyEditing = false,
  registry,
  repository,
}: UseDashboardBuilderOptions) {
  const initialState = createDashboardBuilderState(repository.load() ?? initialDashboard);
  const state = shallowRef(initiallyEditing && actionGate.can("edit") ? enterDashboardEditMode(initialState) : initialState);
  const isSaving = ref(false);
  const saveError = ref<string | null>(null);
  const importError = ref<string | null>(null);
  const selectedWidgetId = ref<string | null>(null);

  const unsubscribe = eventBus.subscribe((event) => {
    switch (event.type) {
      case "WidgetSelected":
        selectedWidgetId.value = event.widgetId;
        break;
      case "WidgetConfigChanged":
        actionGate.execute("edit", () => {
          state.value = replaceDraftWidget(state.value, event.widget);
        });
        break;
      case "FilterChanged": {
        if (!actionGate.can("filter")) break;
        if (event.scope === "global") state.value = updateGlobalFilters(state.value, event.filters);
        else if (event.scope === "local" && event.sourceWidgetId)
          state.value = updateLocalFilters(state.value, event.sourceWidgetId, event.filters);
        else if (event.scope === "cross-widget" && event.sourceWidgetId)
          state.value = applyCrossWidgetFilters(state.value, event.sourceWidgetId, event.filters);
        break;
      }
      case "RefreshRequested": {
        if (!actionGate.can("refresh")) break;
        const dashboard = state.value.draft ?? state.value.saved;
        dashboard.widgets
          .filter((widget) => !event.widgetId || widget.id === event.widgetId)
          .forEach((widget) => {
            const filters = mergeDashboardFilters(
              widget.filterConfig.useGlobalFilters ? dashboard.globalFilters : {},
              widget.crossWidgetFilters,
              widget.localFilters,
            );
            const dataSource = { ...widget.dataSource, parameters: { ...widget.dataSource.parameters, ...filters } };
            widgetDataCache.invalidate(dashboardDataSourceQueryKey(dataSource).join("|"));
          });
        break;
      }
    }
  });
  onScopeDispose(unsubscribe);

  function enterEditMode() {
    if (!actionGate.can("edit")) return;
    saveError.value = null;
    state.value = enterDashboardEditMode(state.value);
  }

  function cancel() {
    saveError.value = null;
    state.value = cancelDashboardDraft(state.value);
  }

  async function save() {
    if (!actionGate.can("save") || !state.value.draft || isSaving.value) return;
    const stateToSave = state.value;
    isSaving.value = true;
    saveError.value = null;
    const result = await persistDashboardDraft(stateToSave, repository);
    // A newer draft may have replaced this one while the save was in flight.
    if (state.value.draft === stateToSave.draft) state.value = result.state;
    saveError.value = result.error;
    isSaving.value = false;
  }

  function updateLayout(layout: readonly DashboardLayoutItem[]) {
    actionGate.execute("edit", () => {
      state.value = updateDraftLayout(state.value, layout);
    });
  }

  function addWidget(type: WidgetType) {
    if (!actionGate.can("edit") || !state.value.draft) return;
    const nextRow = state.value.draft.widgets.reduce(
      (lowestRow, widget) => Math.max(lowestRow, widget.position.y + widget.height),
      0,
    );
    state.value = addDraftWidget(state.value, createWidget(type, createWidgetId(type), { x: 0, y: nextRow }, registry));
  }

  function deleteWidget(widgetId: string) {
    actionGate.execute("edit", () => {
      state.value = deleteDraftWidget(state.value, widgetId);
    });
  }

  function updateWidget(widget: DashboardWidget) {
    eventBus.publish({ type: "WidgetConfigChanged", widget });
  }

  function undo() {
    actionGate.execute("edit", () => {
      state.value = undoDashboardDraft(state.value);
    });
  }

  function redo() {
    actionGate.execute("edit", () => {
      state.value = redoDashboardDraft(state.value);
    });
  }

  function importJson(serializedDashboard: string) {
    if (!actionGate.can("import")) return;
    try {
      const dashboard = importDashboard(serializedDashboard);
      state.value = importDashboardDraft(state.value, dashboard);
      importError.value = null;
    } catch (error) {
      importError.value = error instanceof Error ? error.message : "Dashboard import failed.";
    }
  }

  return {
    dashboard: computed(() => getVisibleDashboard(state.value)),
    isEditing: computed(() => state.value.isEditing),
    isSaving,
    saveError,
    importError,
    selectedWidgetId,
    canUndo: computed(() => state.value.past.length > 0),
    canRedo: computed(() => state.value.future.length > 0),
    enterEditMode,
    cancel,
    save,
    updateLayout,
    addWidget,
    deleteWidget,
    updateWidget,
    undo,
    redo,
    importJson,
  };
}
