<script setup lang="ts">
import { computed, onScopeDispose, reactive, ref } from "vue";

import GraphViewerView from "../views/GraphViewerView.vue";
import { emptyGraphSelection, type GraphDocument, type GraphRoute } from "../model/graph";
import type { GraphInteractionState, GraphRouteQueryState } from "../model/graphInteraction";
import {
  getNetworkNodePresentation,
  networkGraph,
  type NetworkEdgeMetadata,
  type NetworkNodeMetadata,
  type NetworkNodeType,
} from "../network/networkGraph";
import { networkRouteService } from "../network/networkRoutes";
import { networkRuntimeSource } from "../network/networkRealtime";
import { createGraphRuntimeSource, type GraphRuntimeSource } from "../realtime/graphRuntimeSource";
import type { GraphRouteService } from "../services/graphRouteService";
import { useTopologyRealtime } from "../realtime/useTopologyRealtime";

type NetworkGraph = GraphDocument<NetworkNodeType, NetworkNodeMetadata, NetworkEdgeMetadata>;

const props = withDefaults(
  defineProps<{
    graph?: NetworkGraph;
    routeService?: GraphRouteService;
    initialRoute?: GraphRoute | null;
    realtimeSource?: GraphRuntimeSource;
  }>(),
  { graph: () => networkGraph, initialRoute: null }
);

const routeService = computed(() => props.routeService ?? networkRouteService);
const runtimeSource = computed(
  () => props.realtimeSource ?? (props.graph === networkGraph ? networkRuntimeSource : createGraphRuntimeSource(props.graph))
);

const interaction = reactive<GraphInteractionState>({
  selection: emptyGraphSelection(),
  hoveredNodeId: null,
  hoveredEdgeId: null,
  activeRoute: props.initialRoute,
  sourceNodeId: props.initialRoute?.sourceNodeId ?? null,
  destinationNodeId: props.initialRoute?.destinationNodeId ?? null,
});
const routeQuery = ref<GraphRouteQueryState>(props.initialRoute ? { status: "success" } : { status: "idle" });
let requestSequence = 0;

const source = runtimeSource.value;
const realtime = useTopologyRealtime({
  topologyId: source.topologyId,
  graph: props.graph,
  transport: source.transport,
  loadSnapshot: source.loadSnapshot,
  selectedNodeId: () => interaction.selection.nodeIds[0] ?? null,
});

if (source.eventsPerSecond) {
  source.transport.startStress(source.eventsPerSecond, source.createEvent);
  onScopeDispose(() => source.transport.stopStress());
}

async function searchRoute() {
  const { destinationNodeId, sourceNodeId } = interaction;
  if (!sourceNodeId || !destinationNodeId) return;
  const sequence = ++requestSequence;
  routeQuery.value = { status: "loading" };
  try {
    const response = await routeService.value.findRoute({ destinationNodeId, sourceNodeId });
    if (requestSequence !== sequence) return;
    if (response.status === "success") {
      interaction.activeRoute = response.route;
      routeQuery.value = { status: "success" };
    } else {
      interaction.activeRoute = null;
      routeQuery.value = { status: "no-route", message: response.message ?? "No route found." };
    }
  } catch (error) {
    if (requestSequence !== sequence) return;
    interaction.activeRoute = null;
    routeQuery.value = {
      status: "error",
      message: error instanceof Error ? error.message : "Route lookup failed.",
    };
  }
}

function clearRoute() {
  requestSequence += 1;
  interaction.activeRoute = null;
  interaction.sourceNodeId = null;
  interaction.destinationNodeId = null;
  routeQuery.value = { status: "idle" };
}

function selectNode(nodeId: string | null) {
  interaction.selection = nodeId ? { nodeIds: [nodeId], edgeIds: [], groupIds: [] } : emptyGraphSelection();
}
</script>

<template>
  <GraphViewerView
    :connection-state="realtime.connectionState.value"
    :get-node-presentation="getNetworkNodePresentation"
    :graph="graph"
    :interaction="interaction"
    :is-node-stale="realtime.isNodeStale"
    :route-query="routeQuery"
    :runtime="realtime.runtime.value"
    :selected-metric-history="realtime.selectedMetricHistory.value"
    @destination-change="interaction.destinationNodeId = $event"
    @edge-hover="interaction.hoveredEdgeId = $event"
    @edit="() => undefined"
    @node-hover="interaction.hoveredNodeId = $event"
    @node-select="selectNode"
    @route-clear="clearRoute"
    @route-search="searchRoute"
    @source-change="interaction.sourceNodeId = $event"
  />
</template>
