import { defineAsyncComponent, type Component } from "vue";

import { createDataSource, type WidgetDataSource } from "../data/dashboardDataSource";
import type { DashboardWidget, WidgetPosition, WidgetType } from "../model/dashboardWidget";

import KpiWidget from "./KpiWidget.vue";
import LightweightWidget from "./LightweightWidget.vue";
import RuntimeErrorWidget from "./RuntimeErrorWidget.vue";
import WidgetConfigEditor from "./WidgetConfigEditor.vue";

export type WidgetCapabilities = {
  resizable: boolean;
  refreshable: boolean;
  filterable: boolean;
  exportable: boolean;
};

export type WidgetDefinition = {
  type: WidgetType;
  displayName: string;
  component: Component;
  defaultSize: { width: number; height: number };
  defaultConfig: DashboardWidget["config"];
  configEditor?: Component;
  dataSource?: { createDefault: () => WidgetDataSource };
  capabilities: WidgetCapabilities;
  availableInPicker?: boolean;
};

export class WidgetRegistry {
  private readonly definitions = new Map<WidgetType, WidgetDefinition>();

  register(definition: WidgetDefinition): this {
    this.definitions.set(definition.type, definition);
    return this;
  }

  get(type: WidgetType): WidgetDefinition {
    const definition = this.definitions.get(type);
    if (!definition) throw new Error(`Widget type ${type} is not registered.`);
    return definition;
  }

  getPickerItems() {
    return [...this.definitions.values()]
      .filter((definition) => definition.availableInPicker !== false)
      .map(({ type, displayName, defaultSize }) => ({ type, label: displayName, defaultSize }));
  }
}

const dataCapabilities: WidgetCapabilities = {
  resizable: true,
  refreshable: true,
  filterable: true,
  exportable: true,
};

// The chart and table widgets pull in the SVG plotting code and the virtualiser, so
// they load on demand the way React's lazy() loaded them.
const chartWidget = defineAsyncComponent(() => import("./ChartWidget.vue"));
const tableWidget = defineAsyncComponent(() => import("./TableWidget.vue"));
const lazyErrorWidget = defineAsyncComponent(() => Promise.reject(new Error("Lazy widget module failed to load.")));

export function createDefaultWidgetRegistry(): WidgetRegistry {
  return new WidgetRegistry()
    .register({
      type: "kpi",
      displayName: "KPI",
      component: KpiWidget,
      defaultSize: { width: 4, height: 3 },
      defaultConfig: { title: "New KPI" },
      configEditor: WidgetConfigEditor,
      dataSource: { createDefault: () => createDataSource("sales-summary") },
      capabilities: dataCapabilities,
    })
    .register({
      type: "chart",
      displayName: "Chart",
      component: chartWidget,
      defaultSize: { width: 8, height: 5 },
      defaultConfig: { title: "New chart", chartType: "line" },
      configEditor: WidgetConfigEditor,
      dataSource: { createDefault: () => createDataSource("traffic-series") },
      capabilities: dataCapabilities,
    })
    .register({
      type: "table",
      displayName: "Table",
      component: tableWidget,
      defaultSize: { width: 12, height: 5 },
      defaultConfig: { title: "New table" },
      configEditor: WidgetConfigEditor,
      dataSource: { createDefault: () => createDataSource("recent-events") },
      capabilities: dataCapabilities,
    })
    .register({
      type: "lightweight",
      displayName: "Lightweight",
      component: LightweightWidget,
      defaultSize: { width: 3, height: 2 },
      defaultConfig: { title: "Lightweight widget", value: 0 },
      capabilities: { resizable: true, refreshable: false, filterable: false, exportable: true },
      availableInPicker: false,
    })
    .register({
      type: "runtime-error",
      displayName: "Runtime error",
      component: RuntimeErrorWidget,
      defaultSize: { width: 4, height: 3 },
      defaultConfig: { title: "Runtime error widget" },
      capabilities: { resizable: true, refreshable: false, filterable: false, exportable: false },
      availableInPicker: false,
    })
    .register({
      type: "lazy-error",
      displayName: "Lazy error",
      component: lazyErrorWidget,
      defaultSize: { width: 4, height: 3 },
      defaultConfig: { title: "Lazy error widget" },
      capabilities: { resizable: true, refreshable: false, filterable: false, exportable: false },
      availableInPicker: false,
    });
}

export const defaultWidgetRegistry = createDefaultWidgetRegistry();
export const widgetPickerItems = defaultWidgetRegistry.getPickerItems();

export function createWidget(
  type: WidgetType,
  id: string,
  position: WidgetPosition,
  registry: WidgetRegistry = defaultWidgetRegistry,
): DashboardWidget {
  const definition = registry.get(type);
  const widget = {
    id,
    type,
    position,
    width: definition.defaultSize.width,
    height: definition.defaultSize.height,
    config: structuredClone(definition.defaultConfig),
    dataSource: definition.dataSource?.createDefault() ?? createDataSource("sales-summary"),
    filterConfig: {
      useGlobalFilters: definition.capabilities.filterable,
      acceptCrossWidgetFilters: definition.capabilities.filterable,
    },
    localFilters: {},
    crossWidgetFilters: {},
  };
  return widget as DashboardWidget;
}
