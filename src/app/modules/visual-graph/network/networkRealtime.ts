import { topologyMode } from "@core/config/dataMode";
import { createGraphRuntimeSource, type GraphRealtimeSource } from "../realtime/graphRuntimeSource";
import { createServerTopologyTransport, fetchTopologySnapshot } from "../realtime/serverTopologySource";
import { networkGraph } from "./networkGraph";

export const networkTopologyId = "seoul-production";

/**
 * Curated starting state for the demo topology so the first paint shows a mixed
 * health picture instead of an all-green graph.
 */
export const networkRuntimeSource = createGraphRuntimeSource(networkGraph, {
  topologyId: networkTopologyId,
  eventsPerSecond: 10,
  initialNodeStatus: {
    "core-router": "healthy",
    "edge-firewall": "healthy",
    "api-server": "healthy",
    "worker-server": "warning",
  },
  initialEdgeStatus: {
    "router-to-firewall": "active",
    "firewall-to-api": "active",
    "firewall-to-worker": "degraded",
  },
});

/**
 * The source the viewer actually uses.
 *
 * A resync is handled by reconnecting: the controller refetches the snapshot on
 * connect, which is the same path a first load takes. Doing anything cleverer
 * here would duplicate logic the controller already owns.
 */
function createServerNetworkSource(): GraphRealtimeSource {
  let lastSequence = 0;

  const transport = createServerTopologyTransport({
    getLastSequence: () => lastSequence,
    onResyncRequired: () => {
      lastSequence = 0;
      void transport.connect(networkTopologyId);
    },
  });

  transport.subscribe((event) => {
    lastSequence = Math.max(lastSequence, event.sequence);
  });

  return {
    topologyId: networkTopologyId,
    transport,
    loadSnapshot: (topologyId) => fetchTopologySnapshot(topologyId),
  };
}

/**
 * `topologyMode` decides. In the React boilerplate the container took the mock
 * source unconditionally while a tested server transport sat unused beside it,
 * so server mode rendered a generated event stream and the page displayed
 * "Realtime: connected" while doing it.
 */
export const networkRealtimeSource: GraphRealtimeSource =
  topologyMode === "server" ? createServerNetworkSource() : networkRuntimeSource;

export const networkRealtimeTransport = networkRuntimeSource.transport;
export const loadNetworkRuntimeSnapshot = networkRuntimeSource.loadSnapshot;
export const createNetworkEvent = networkRuntimeSource.createEvent;
