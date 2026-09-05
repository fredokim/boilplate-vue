import { toRaw } from "vue";

import type { Dashboard, DashboardWidget } from "../model/dashboardWidget";

/**
 * structuredClone, minus the Proxy.
 *
 * Everything that reaches this module from a component is a reactive proxy --
 * a prop, a ref's value -- and structuredClone cannot clone one. It throws
 * DataCloneError, nothing catches it, and the dashboard renders nothing at
 * all: the route was blank in a browser while every unit test passed, because
 * the tests call these functions with plain objects.
 *
 * `toRaw` hands back the underlying object, whose nested values are plain, so
 * one unwrap at the point of cloning covers the tree. The React boilerplate
 * this was ported from needs none of it, which is exactly why it was missing.
 */
function clone<T>(value: T): T {
  return structuredClone(toRaw(value));
}

export const DASHBOARD_PERSONALIZATION_VERSION = 1 as const;

export type DashboardPersonalizationOverride = {
  globalFilters?: Dashboard["globalFilters"];
  hiddenWidgetIds: string[];
  widgetOverrides: Record<string, DashboardWidget>;
  addedWidgets: DashboardWidget[];
};

export type DashboardPreset = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  override: DashboardPersonalizationOverride;
};

export type DashboardPersonalization = {
  version: typeof DASHBOARD_PERSONALIZATION_VERSION;
  userId: string;
  dashboardId: string;
  activePresetId: string;
  presets: DashboardPreset[];
};

export function createEmptyPersonalizationOverride(): DashboardPersonalizationOverride {
  return { hiddenWidgetIds: [], widgetOverrides: {}, addedWidgets: [] };
}

export function createDashboardPersonalization(
  userId: string,
  dashboardId: string,
  now = new Date().toISOString(),
): DashboardPersonalization {
  return {
    version: DASHBOARD_PERSONALIZATION_VERSION,
    userId,
    dashboardId,
    activePresetId: "default",
    presets: [{ id: "default", name: "My dashboard", createdAt: now, updatedAt: now, override: createEmptyPersonalizationOverride() }],
  };
}

function sameValue(left: unknown, right: unknown) {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function applyDashboardPersonalization(
  baseDashboard: Dashboard,
  override: DashboardPersonalizationOverride,
): Dashboard {
  const hiddenIds = new Set(override.hiddenWidgetIds);
  const baseWidgets = baseDashboard.widgets
    .filter((widget) => !hiddenIds.has(widget.id))
    .map((widget) => clone(override.widgetOverrides[widget.id] ?? widget));
  return {
    ...clone(baseDashboard),
    globalFilters: clone(override.globalFilters ?? baseDashboard.globalFilters),
    widgets: [...baseWidgets, ...clone(override.addedWidgets)],
  };
}

export function deriveDashboardPersonalization(
  baseDashboard: Dashboard,
  personalizedDashboard: Dashboard,
): DashboardPersonalizationOverride {
  const baseById = new Map(baseDashboard.widgets.map((widget) => [widget.id, widget]));
  const personalizedById = new Map(personalizedDashboard.widgets.map((widget) => [widget.id, widget]));
  const widgetOverrides: Record<string, DashboardWidget> = {};
  const addedWidgets: DashboardWidget[] = [];

  personalizedDashboard.widgets.forEach((widget) => {
    const baseWidget = baseById.get(widget.id);
    if (!baseWidget) addedWidgets.push(clone(widget));
    else if (!sameValue(baseWidget, widget)) widgetOverrides[widget.id] = clone(widget);
  });

  return {
    ...(sameValue(baseDashboard.globalFilters, personalizedDashboard.globalFilters)
      ? {}
      : { globalFilters: clone(personalizedDashboard.globalFilters) }),
    hiddenWidgetIds: baseDashboard.widgets
      .filter((widget) => !personalizedById.has(widget.id))
      .map((widget) => widget.id),
    widgetOverrides,
    addedWidgets,
  };
}

export function getActiveDashboardPreset(personalization: DashboardPersonalization): DashboardPreset {
  return personalization.presets.find((preset) => preset.id === personalization.activePresetId)
    ?? personalization.presets[0]
    ?? (() => { throw new Error("Dashboard personalization requires at least one preset."); })();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object");
}

export function isDashboardPersonalization(value: unknown): value is DashboardPersonalization {
  if (!isRecord(value)) return false;
  const document = value;
  if (document.version !== DASHBOARD_PERSONALIZATION_VERSION
    || typeof document.userId !== "string"
    || typeof document.dashboardId !== "string"
    || typeof document.activePresetId !== "string"
    || !Array.isArray(document.presets)
    || document.presets.length === 0) return false;
  const validPresets = document.presets.every((preset: unknown) => {
    if (!isRecord(preset) || !isRecord(preset.override)) return false;
    return typeof preset.id === "string" && typeof preset.name === "string"
      && typeof preset.createdAt === "string" && typeof preset.updatedAt === "string"
      && Array.isArray(preset.override.hiddenWidgetIds)
      && preset.override.hiddenWidgetIds.every((id: unknown) => typeof id === "string")
      && Array.isArray(preset.override.addedWidgets)
      && isRecord(preset.override.widgetOverrides);
  });
  return validPresets
    && document.presets.some((preset: unknown) => isRecord(preset) && preset.id === document.activePresetId);
}

export function exportDashboardPersonalization(personalization: DashboardPersonalization) {
  return JSON.stringify(personalization, null, 2);
}

export function importDashboardPersonalization(serialized: string): DashboardPersonalization {
  let parsed: unknown;
  try {
    parsed = JSON.parse(serialized);
  } catch {
    throw new Error("Personalization JSON is not valid.");
  }
  if (!isDashboardPersonalization(parsed)) throw new Error("Dashboard personalization schema version 1 is required.");
  return structuredClone(parsed);
}
