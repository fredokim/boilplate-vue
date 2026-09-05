import { serverWakeGate } from "@core/api/server-wake";
import { computed, onScopeDispose, shallowRef, toValue, watch, type MaybeRefOrGetter } from "vue";
import { watchForIdle } from "@core/realtime/idleSuspension";

import type { GraphDocument, GraphMetadata } from "../model/graph";
import { TopologyRealtimeController } from "./controller";
import { TopologyRuntimeStore } from "./runtimeStore";
import type { RuntimeSnapshotProvider } from "./types";
import type { TopologyRealtimeTransport } from "./transport";

const STALE_TICK_MS = 5_000;

/**
 * The runtime store is framework-agnostic: it exposes subscribe/getSnapshot, which React
 * consumes through useSyncExternalStore and Vue consumes by pushing each snapshot into a
 * shallowRef. Nothing below this file knows which framework is rendering.
 */
export function useTopologyRealtime<
  TNodeType extends string,
  TNodeMetadata extends GraphMetadata,
  TEdgeMetadata extends GraphMetadata,
>(options: {
  topologyId: string;
  graph: GraphDocument<TNodeType, TNodeMetadata, TEdgeMetadata>;
  transport: TopologyRealtimeTransport;
  loadSnapshot: RuntimeSnapshotProvider;
  selectedNodeId: MaybeRefOrGetter<string | null>;
}) {
  const { graph, loadSnapshot, topologyId, transport } = options;

  const store = new TopologyRuntimeStore({
    knownNodeIds: graph.nodes.map((node) => node.id),
    knownEdgeIds: graph.edges.map((edge) => edge.id),
  });
  const controller = new TopologyRealtimeController({
    topologyId,
    transport,
    store,
    loadSnapshot,
    waitForServer: () => serverWakeGate.wait(),
  });

  const runtime = shallowRef(store.getSnapshot());
  // The controller, not the transport. The transport reports only what its
  // socket did, so it can never say `suspended` (the controller decides that)
  // or `reconnecting` (which exists only between a drop and the next attempt).
  // Reading it here is what made an idle release show up as a failure.
  const connectionState = shallowRef(controller.getConnectionState());
  const now = shallowRef(0);

  const unsubscribeStore = store.subscribe(() => {
    runtime.value = store.getSnapshot();
  });
  const unsubscribeConnection = controller.subscribeConnection((state) => {
    connectionState.value = state;
  });

  void controller.start();

  const onVisibility = () => controller.setHidden(document.hidden);
  document.addEventListener("visibilitychange", onVisibility);
  const staleTimer = setInterval(() => {
    now.value = Date.now();
  }, STALE_TICK_MS);

  /**
   * Hands the socket back when nobody is watching. An open socket is continuous
   * traffic, so a forgotten tab keeps a free instance awake all night for the
   * same cost as one in use.
   *
   * `suspend()` and `resume()` rather than stop and start: stop already
   * disconnects and blocks the reconnect backoff, but lands on `disconnected`,
   * the state that means a fault. Suspending says which happened; resuming resubscribes and
   * resyncs from a fresh snapshot -- which is what a viewer who has been away
   * needs anyway, since the retention window may have moved past them.
   */
  const stopIdleWatch = watchForIdle({
    onIdle: () => controller.suspend(),
    onResume: () => void controller.resume(),
  });

  const stopSelectionWatch = watch(
    () => toValue(options.selectedNodeId),
    (nodeId) => store.setMonitoredNode(nodeId),
    { immediate: true },
  );

  onScopeDispose(() => {
    stopIdleWatch();
    stopSelectionWatch();
    clearInterval(staleTimer);
    document.removeEventListener("visibilitychange", onVisibility);
    unsubscribeConnection();
    unsubscribeStore();
    controller.stop();
  });

  const selectedMetricHistory = computed(() => {
    const nodeId = toValue(options.selectedNodeId);
    // Reading `now` and `runtime` keeps the history in step with incoming flushes.
    void runtime.value;
    return nodeId ? store.getMetricHistory(nodeId) : {};
  });

  return {
    runtime,
    connectionState,
    now,
    selectedMetricHistory,
    isNodeStale: (nodeId: string, thresholdMs = 30_000) => store.isNodeStale(nodeId, now.value, thresholdMs),
    resync: () => controller.resync(),
  };
}
