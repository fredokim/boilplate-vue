import { ref } from "vue";

import {
  createEmptyPersonalizationOverride,
  exportDashboardPersonalization,
  importDashboardPersonalization,
  type DashboardPersonalization,
} from "../personalization/dashboardPersonalization";
import {
  loadDashboardPersonalization,
  type DashboardPersonalizationRepository,
} from "../personalization/dashboardPersonalizationRepository";

export function useDashboardPersonalization(
  repository: DashboardPersonalizationRepository,
  userId: string,
  dashboardId: string,
) {
  const personalization = ref<DashboardPersonalization>(loadDashboardPersonalization(repository, userId, dashboardId));
  const error = ref<string | null>(null);

  function persist(next: DashboardPersonalization) {
    personalization.value = next;
    error.value = null;
    void repository.save(next).catch((reason: unknown) => {
      error.value = reason instanceof Error ? reason.message : "Personalization could not be saved.";
    });
  }

  function selectPreset(presetId: string) {
    if (!personalization.value.presets.some((preset) => preset.id === presetId)) return;
    persist({ ...personalization.value, activePresetId: presetId });
  }

  function createPreset(name: string) {
    const current = personalization.value;
    const source = current.presets.find((preset) => preset.id === current.activePresetId);
    const now = new Date().toISOString();
    const id = `preset-${crypto.randomUUID()}`;
    persist({
      ...current,
      activePresetId: id,
      presets: [
        ...current.presets,
        {
          id,
          name: name.trim() || `Preset ${String(current.presets.length + 1)}`,
          createdAt: now,
          updatedAt: now,
          override: structuredClone(source?.override ?? createEmptyPersonalizationOverride()),
        },
      ],
    });
  }

  function resetActivePreset() {
    const current = personalization.value;
    const now = new Date().toISOString();
    persist({
      ...current,
      presets: current.presets.map((preset) =>
        preset.id === current.activePresetId
          ? { ...preset, updatedAt: now, override: createEmptyPersonalizationOverride() }
          : preset,
      ),
    });
  }

  function deleteActivePreset() {
    const current = personalization.value;
    if (current.presets.length <= 1) return;
    const presets = current.presets.filter((preset) => preset.id !== current.activePresetId);
    const first = presets[0];
    if (!first) return;
    persist({ ...current, presets, activePresetId: first.id });
  }

  function importJson(serialized: string) {
    try {
      const imported = importDashboardPersonalization(serialized);
      if (imported.dashboardId !== dashboardId) throw new Error("Personalization belongs to a different dashboard.");
      persist({ ...imported, userId });
    } catch (reason) {
      error.value = reason instanceof Error ? reason.message : "Personalization import failed.";
    }
  }

  return {
    personalization,
    error,
    selectPreset,
    createPreset,
    resetActivePreset,
    deleteActivePreset,
    importJson,
    exportJson: () => exportDashboardPersonalization(personalization.value),
    replacePersonalization: (next: DashboardPersonalization) => {
      personalization.value = next;
    },
  };
}
