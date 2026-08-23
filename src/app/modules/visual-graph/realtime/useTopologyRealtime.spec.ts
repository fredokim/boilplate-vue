import { effectScope, nextTick } from "vue";
import { describe, expect, it } from "vitest";

import { networkGraph } from "../network/networkGraph";
import { createGraphRuntimeSource } from "./graphRuntimeSource";
import { useTopologyRealtime } from "./useTopologyRealtime";

async function settle(times = 12) {
  for (let index = 0; index < times; index += 1) {
    await nextTick();
    await Promise.resolve();
  }
}

describe("useTopologyRealtime (Vue)", () => {
  it("pushes store snapshots into Vue reactivity", async () => {
    const scope = effectScope();
    const source = createGraphRuntimeSource(networkGraph, { eventsPerSecond: 0 });

    const realtime = scope.run(() =>
      useTopologyRealtime({
        topologyId: source.topologyId,
        graph: networkGraph,
        transport: source.transport,
        loadSnapshot: source.loadSnapshot,
        selectedNodeId: () => null,
      })
    );
    if (!realtime) throw new Error("composable did not run");

    await settle();

    expect(realtime.connectionState.value).toBe("connected");
    // The resync populates one runtime entry per node and edge in the topology.
    expect(Object.keys(realtime.runtime.value.nodes)).toHaveLength(networkGraph.nodes.length);
    expect(Object.keys(realtime.runtime.value.edges)).toHaveLength(networkGraph.edges.length);

    scope.stop();
  });

  it("applies streamed events through the flush timer and keeps the snapshot reactive", async () => {
    const scope = effectScope();
    const source = createGraphRuntimeSource(networkGraph, { eventsPerSecond: 0 });

    const realtime = scope.run(() =>
      useTopologyRealtime({
        topologyId: source.topologyId,
        graph: networkGraph,
        transport: source.transport,
        loadSnapshot: source.loadSnapshot,
        selectedNodeId: () => null,
      })
    );
    if (!realtime) throw new Error("composable did not run");

    await settle();
    const before = realtime.runtime.value;

    for (let index = 0; index < 5; index += 1) source.transport.emit(source.createEvent(index));
    await new Promise((resolve) => setTimeout(resolve, 120));

    expect(realtime.runtime.value).not.toBe(before);
    expect(realtime.runtime.value.diagnostics.applied).toBeGreaterThan(0);
    expect(realtime.runtime.value.diagnostics.unknownEntities).toBe(0);

    scope.stop();
  });

  it("stops the controller when the effect scope is disposed", async () => {
    const scope = effectScope();
    const source = createGraphRuntimeSource(networkGraph, { eventsPerSecond: 0 });

    const realtime = scope.run(() =>
      useTopologyRealtime({
        topologyId: source.topologyId,
        graph: networkGraph,
        transport: source.transport,
        loadSnapshot: source.loadSnapshot,
        selectedNodeId: () => null,
      })
    );
    if (!realtime) throw new Error("composable did not run");

    await settle();
    scope.stop();

    expect(source.transport.getConnectionState()).toBe("disconnected");
  });
});
