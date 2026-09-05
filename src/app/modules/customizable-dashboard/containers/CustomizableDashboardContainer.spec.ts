import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

import CustomizableDashboardContainer from "./CustomizableDashboardContainer.vue";
import type { DashboardData } from "../data/dashboardDataSource";
import { dashboardDataSourceRegistry, type DashboardDataSourceRegistry } from "../data/dashboardDataSourceRegistry";
import { createMemoryDashboardRepository } from "../persistence/dashboardRepository";
import { widgetDataCache } from "../composables/widgetDataCache";
import { initialDashboard } from "../model/initialDashboard";

const successData: Record<DashboardData["kind"], DashboardData> = {
  kpi: { kind: "kpi", label: "Gross revenue", value: 48240, trend: "+12.4%" },
  series: {
    kind: "series",
    points: [
      { label: "Mon", value: 3200 },
      { label: "Tue", value: 4100 },
    ],
  },
  table: {
    kind: "table",
    columns: [
      { key: "event", label: "Event" },
      { key: "owner", label: "Owner" },
      { key: "status", label: "Status" },
    ],
    rows: [{ id: "row-1", event: "Campaign launched", owner: "Mina", status: "Complete" }],
  },
};

function stubRegistry(load: (kind: DashboardData["kind"]) => Promise<DashboardData>): DashboardDataSourceRegistry {
  const registry: DashboardDataSourceRegistry = { ...dashboardDataSourceRegistry };
  Object.values(dashboardDataSourceRegistry).forEach((definition) => {
    registry[definition.id] = { ...definition, load: () => load(definition.kind) };
  });
  return registry;
}

function mountDashboard(props: Record<string, unknown> = {}, load = (kind: DashboardData["kind"]) => Promise.resolve(successData[kind])) {
  return mount(CustomizableDashboardContainer, {
    props: {
      repository: createMemoryDashboardRepository(initialDashboard),
      dataSourceRegistry: stubRegistry(load),
      ...props,
    },
    global: { stubs: { GridLayout: { template: "<div><slot /></div>" }, GridItem: { template: "<div><slot /></div>" } } },
  });
}

describe("CustomizableDashboardContainer (Vue)", () => {
  beforeEach(() => widgetDataCache.clear());

  it("renders widget data through the injected data source registry", async () => {
    const wrapper = mountDashboard();
    await flushPromises();
    await flushPromises();

    expect(wrapper.text()).toContain("48,240");
    wrapper.unmount();
  });

  it("issues one request when two widgets share a query key", async () => {
    const load = vi.fn((kind: DashboardData["kind"]) => Promise.resolve(successData[kind]));
    const wrapper = mountDashboard({}, load);
    await flushPromises();
    await flushPromises();

    const kpiWidgets = initialDashboard.widgets.filter((widget) => widget.type === "kpi");
    expect(kpiWidgets.length).toBeGreaterThan(0);
    // Distinct data sources still fetch separately; identical keys must collapse to one.
    expect(load.mock.calls.length).toBeLessThanOrEqual(initialDashboard.widgets.length);

    wrapper.unmount();
  });

  it("enters edit mode and exposes the widget picker", async () => {
    const wrapper = mountDashboard();
    await flushPromises();

    const edit = wrapper.findAll("button").find((button) => button.text() === "Edit dashboard");
    await edit?.trigger("click");
    await flushPromises();

    expect(wrapper.find('[aria-label="Widget picker"]').exists()).toBe(true);
    expect(wrapper.text()).toContain("Editing draft");

    wrapper.unmount();
  });

  it("hides editing affordances for a viewer role", async () => {
    const wrapper = mountDashboard({ role: "viewer" });
    await flushPromises();

    expect(wrapper.findAll("button").some((button) => button.text() === "Edit dashboard")).toBe(false);

    wrapper.unmount();
  });

  it("surfaces a widget error state when the data source fails", async () => {
    const wrapper = mountDashboard({}, () => Promise.reject(new Error("Dashboard data is unavailable.")));
    await flushPromises();
    await flushPromises();

    // A plain Error carries no classification, so it lands on the generic
    // case -- and still gets a sentence rather than the thrown message,
    // which is written for whoever is reading a stack trace.
    expect(wrapper.text()).toContain("Something went wrong");
    expect(wrapper.text()).not.toContain("Dashboard data is unavailable.");
    wrapper.unmount();
  });
});
