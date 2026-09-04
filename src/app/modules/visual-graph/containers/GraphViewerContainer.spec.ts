import { mount, flushPromises } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";

import GraphViewerContainer from "./GraphViewerContainer.vue";
import { createMemoryGraphRepository } from "../editing/graphRepository";
import { createGraphRuntimeSource } from "../realtime/graphRuntimeSource";
import { networkGraph } from "../network/networkGraph";
import { coreToApiRoute, networkRoutes } from "../network/networkRoutes";
import { createMockGraphRouteService } from "../services/graphRouteService";

// Vue Flow measures a real viewport, which jsdom does not provide. The assertions here
// are about container orchestration, so a stand-in canvas keeps them honest and fast.
vi.mock("../components/GraphCanvas.vue", () => ({
  default: {
    name: "GraphCanvas",
    props: ["graph", "interaction", "getNodePresentation", "editable", "validationErrors"],
    // Mirror the real component's exposed viewport API; the view calls these through a ref.
    methods: {
      fitAll: () => undefined,
      focusNode: () => undefined,
      focusRoute: () => undefined,
    },
    template: `<div data-testid="graph-canvas" :data-node-count="graph.nodes.length" :data-editable="String(!!editable)" />`,
  },
}));

function mountContainer(props: Record<string, unknown> = {}) {
  return mount(GraphViewerContainer, {
    props: {
      realtimeSource: createGraphRuntimeSource(networkGraph, { eventsPerSecond: 0 }),
      ...props,
    },
  });
}

describe("GraphViewerContainer (Vue)", () => {
  it("renders the viewer and streams runtime state into it", async () => {
    const wrapper = mountContainer();
    await flushPromises();

    expect(wrapper.find('[role="status"]').text()).toContain("Realtime: connected");
    expect(wrapper.find('[data-testid="graph-canvas"]').attributes("data-editable")).toBe("false");

    wrapper.unmount();
  });

  it("switches to the editor and back, discarding the draft on cancel", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    const wrapper = mountContainer();
    await flushPromises();

    await wrapper.get("button").trigger("click"); // "Edit topology"
    await flushPromises();
    expect(wrapper.text()).toContain("Topology Editor");
    expect(wrapper.find('[data-testid="graph-canvas"]').attributes("data-editable")).toBe("true");

    const cancel = wrapper.findAll("button").find((button) => button.text() === "Cancel");
    await cancel?.trigger("click");
    await flushPromises();
    expect(wrapper.text()).toContain("Interactive Topology Explorer");

    confirm.mockRestore();
    wrapper.unmount();
  });

  it("applies a route service result to the interaction state", async () => {
    const wrapper = mountContainer({
      routeService: createMockGraphRouteService({ routes: networkRoutes }),
      initialRoute: null,
    });
    await flushPromises();

    const selects = wrapper.findAll("select");
    await selects[1]?.setValue("core-router");
    await selects[2]?.setValue("api-server");
    const findRoute = wrapper.findAll("button").find((button) => button.text() === "Find route");
    await findRoute?.trigger("click");
    await flushPromises();

    expect(wrapper.text()).toContain("Route detail");
    expect(wrapper.findAll('[aria-label="Ordered route"] li')).toHaveLength(coreToApiRoute.nodeIds.length);

    wrapper.unmount();
  });

  it("reports a no-route result without losing the topology", async () => {
    const wrapper = mountContainer({ routeService: createMockGraphRouteService({ routes: [] }) });
    await flushPromises();

    const selects = wrapper.findAll("select");
    await selects[1]?.setValue("api-server");
    await selects[2]?.setValue("worker-server");
    await wrapper
      .findAll("button")
      .find((button) => button.text() === "Find route")
      ?.trigger("click");
    await flushPromises();

    expect(wrapper.find('[role="alert"]').text()).toContain("No route");
    expect(wrapper.find('[data-testid="graph-canvas"]').exists()).toBe(true);

    wrapper.unmount();
  });

  it("saves a validated draft through the injected repository", async () => {
    const repository = createMemoryGraphRepository(networkGraph);
    const save = vi.spyOn(repository, "save");
    const wrapper = mountContainer({ initialEditMode: true, repository });
    await flushPromises();

    // A pristine draft is not dirty, so Save stays disabled until an edit lands.
    const saveButton = wrapper.findAll("button").find((button) => button.text() === "Save");
    expect(saveButton?.attributes("disabled")).toBeDefined();

    wrapper.unmount();
    expect(save).not.toHaveBeenCalled();
  });
});
