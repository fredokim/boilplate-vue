<script setup lang="ts">
import { computed, onScopeDispose, reactive, ref, shallowRef } from "vue";
import type { Connection } from "@vue-flow/core";

import GraphEditorView from "../views/GraphEditorView.vue";
import GraphViewerView from "../views/GraphViewerView.vue";
import {
  addEdge,
  addGroup,
  addNode,
  copySelection,
  moveGroup,
  moveSelection,
  pasteClipboard,
  removeSelection,
  updateNode,
  type GraphClipboard,
  type GraphCommandResult,
} from "../editing/graphCommands";
import {
  applyGraphCommand,
  beginGraphEdit,
  cancelGraphEdit,
  createGraphEditorSession,
  redoGraphEdit,
  saveGraphEdit,
  undoGraphEdit,
} from "../editing/graphEditorSession";
import { browserGraphIdFactory, type GraphIdFactory } from "../editing/graphIdFactory";
import { createMemoryGraphRepository, type GraphRepository } from "../editing/graphRepository";
import { exportGraph, importGraph } from "../editing/graphSerialization";
import {
  createMockNetworkValidationService,
  validateGraphStructure,
  type GraphValidationError,
  type NetworkValidationService,
} from "../editing/graphValidation";
import { providedPositionLayout, type GraphLayoutEngine } from "../layout/graphLayout";
import { createLayoutCoordinator, createWorkerLayoutExecutor } from "../layout/layoutCoordinator";
import { emptyGraphSelection, type GraphDocument, type GraphPosition, type GraphRoute, type GraphSelection } from "../model/graph";
import type { GraphInteractionState, GraphRouteQueryState } from "../model/graphInteraction";
import {
  getNetworkNodePresentation,
  networkGraph,
  type NetworkEdgeMetadata,
  type NetworkNodeMetadata,
  type NetworkNodeType,
} from "../network/networkGraph";
import { networkRouteService } from "../network/networkRoutes";
import { networkRealtimeSource } from "../network/networkRealtime";
import { createGraphRuntimeSource, type GraphRealtimeSource } from "../realtime/graphRuntimeSource";
import type { GraphRouteService } from "../services/graphRouteService";
import { useTopologyRealtime } from "../realtime/useTopologyRealtime";

type NetworkGraph = GraphDocument<NetworkNodeType, NetworkNodeMetadata, NetworkEdgeMetadata>;

const props = withDefaults(
  defineProps<{
    graph?: NetworkGraph;
    routeService?: GraphRouteService;
    layoutEngine?: GraphLayoutEngine;
    repository?: GraphRepository<NetworkGraph>;
    idFactory?: GraphIdFactory;
    validationService?: NetworkValidationService;
    initialRoute?: GraphRoute | null;
    initialEditMode?: boolean;
    realtimeSource?: GraphRealtimeSource;
  }>(),
  { graph: () => networkGraph, initialRoute: null, initialEditMode: false }
);

const routeService = computed(() => props.routeService ?? networkRouteService);
const layoutEngine = computed(() => props.layoutEngine ?? providedPositionLayout);
const idFactory = computed(() => props.idFactory ?? browserGraphIdFactory);
const validationService = computed(() => props.validationService ?? createMockNetworkValidationService());
const repository = props.repository ?? createMemoryGraphRepository(props.graph);
const layoutCoordinator = createLayoutCoordinator(createWorkerLayoutExecutor());

const session = shallowRef(
  props.initialEditMode ? beginGraphEdit(createGraphEditorSession(props.graph)) : createGraphEditorSession(props.graph)
);
const clipboard = shallowRef<GraphClipboard<NetworkNodeType, NetworkNodeMetadata, NetworkEdgeMetadata> | null>(null);
const paletteType = ref<NetworkNodeType | null>(null);
const validationErrors = ref<readonly GraphValidationError[]>([]);
const saving = ref(false);
const layoutTimeMs = ref(0);

const interaction = reactive<GraphInteractionState>({
  selection: emptyGraphSelection(),
  hoveredNodeId: null,
  hoveredEdgeId: null,
  activeRoute: props.initialEditMode ? null : props.initialRoute,
  sourceNodeId: props.initialEditMode ? null : (props.initialRoute?.sourceNodeId ?? null),
  destinationNodeId: props.initialEditMode ? null : (props.initialRoute?.destinationNodeId ?? null),
});
const routeQuery = ref<GraphRouteQueryState>(
  props.initialEditMode || !props.initialRoute ? { status: "idle" } : { status: "success" }
);
let requestSequence = 0;

const source = props.realtimeSource ?? (props.graph === networkGraph ? networkRealtimeSource : createGraphRuntimeSource(props.graph));
const realtime = useTopologyRealtime({
  topologyId: source.topologyId,
  graph: props.graph,
  transport: source.transport,
  loadSnapshot: source.loadSnapshot,
  selectedNodeId: () => interaction.selection.nodeIds[0] ?? null,
});

// Only the scripted mock has a driver. A server source leaves this absent, so
// the demo's synthetic event stream cannot run on top of the gateway's real one.
const stopDriving = source.driveEvents?.();

if (stopDriving) onScopeDispose(stopDriving);

const draftGraph = computed(() => session.value.draftGraph);
const editMode = computed(() => session.value.editMode && draftGraph.value !== undefined);
const laidOutSavedGraph = computed(() => layoutEngine.value.layout(session.value.savedGraph) as NetworkGraph);
const laidOutDraftGraph = computed(() =>
  draftGraph.value ? (layoutEngine.value.layout(draftGraph.value) as NetworkGraph) : undefined
);

// Leaving a dirty draft loses it, so warn the same way the React container does.
const beforeUnload = (event: BeforeUnloadEvent) => {
  if (!session.value.editMode || !session.value.dirty) return;
  event.preventDefault();
  event.returnValue = "";
};
window.addEventListener("beforeunload", beforeUnload);
onScopeDispose(() => window.removeEventListener("beforeunload", beforeUnload));

function applyCommand(result: GraphCommandResult<NetworkGraph>) {
  session.value = applyGraphCommand(session.value, result);
  if (result.error) {
    validationErrors.value = [
      { targetType: "graph", targetId: "draft", code: "EDIT_REJECTED", message: result.error },
    ];
  } else if (result.changed) {
    validationErrors.value = [];
  }
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
    routeQuery.value = { status: "error", message: error instanceof Error ? error.message : "Route lookup failed." };
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

function enterEditMode() {
  clearRoute();
  interaction.selection = emptyGraphSelection();
  validationErrors.value = [];
  session.value = beginGraphEdit(session.value);
}

function addDraftNode(position: GraphPosition) {
  const graph = draftGraph.value;
  const type = paletteType.value;
  if (!graph || !type) return;
  const id = idFactory.value.createNodeId(type);
  const typeCount = graph.nodes.filter((node) => node.type === type).length + 1;
  applyCommand(
    addNode(graph, {
      id,
      type,
      label: `${getNetworkNodePresentation(type).typeLabel} ${String(typeCount)}`,
      position,
      metadata: { hostname: id, ipAddress: "Unassigned", location: "Unassigned", description: "" },
    })
  );
  interaction.selection = { nodeIds: [id], edgeIds: [], groupIds: [] };
  paletteType.value = null;
}

function connectDraftNodes(connection: Connection) {
  const graph = draftGraph.value;
  if (!graph || !connection.source || !connection.target) return;
  applyCommand(
    addEdge(graph, {
      id: idFactory.value.createEdgeId(),
      sourceNodeId: connection.source,
      targetNodeId: connection.target,
      ...(connection.sourceHandle ? { sourcePortId: connection.sourceHandle } : {}),
      ...(connection.targetHandle ? { targetPortId: connection.targetHandle } : {}),
      metadata: { protocol: "Unspecified", bandwidthMbps: 0, interface: "default", status: "up" },
    })
  );
}

function deleteSelection() {
  const graph = draftGraph.value;
  const { edgeIds, groupIds, nodeIds } = interaction.selection;
  if (!graph || (!nodeIds.length && !edgeIds.length && !groupIds.length)) return;
  const result = removeSelection(graph, interaction.selection);
  applyCommand(result);
  if (result.changed) interaction.selection = emptyGraphSelection();
}

function copyDraftSelection() {
  const graph = draftGraph.value;
  if (graph) clipboard.value = copySelection(graph, interaction.selection);
}

function pasteDraftSelection() {
  const graph = draftGraph.value;
  if (!graph || !clipboard.value) return;
  const result = pasteClipboard(graph, clipboard.value, idFactory.value);
  applyCommand(result);
  if (result.changed) interaction.selection = result.selection;
}

function groupDraftSelection() {
  const graph = draftGraph.value;
  if (!graph || interaction.selection.nodeIds.length < 2) return;
  const id = idFactory.value.createGroupId();
  applyCommand(
    addGroup(graph, {
      id,
      name: `Group ${String((graph.groups?.length ?? 0) + 1)}`,
      childNodeIds: interaction.selection.nodeIds,
      expanded: true,
    })
  );
  interaction.selection = { nodeIds: [], edgeIds: [], groupIds: [id] };
}

async function validateDraft() {
  const graph = draftGraph.value;
  if (!graph) return [];
  const structural = validateGraphStructure(graph);
  const network = await validationService.value.validate(graph);
  const errors = [...structural.errors, ...network.errors];
  validationErrors.value = errors;
  return errors;
}

async function saveDraft() {
  const graph = draftGraph.value;
  if (!graph) return;
  saving.value = true;
  const errors = await validateDraft();
  if (!errors.length) {
    await repository.save(graph);
    session.value = saveGraphEdit(session.value);
    interaction.selection = emptyGraphSelection();
  }
  saving.value = false;
}

function cancelDraft() {
  if (session.value.dirty && !window.confirm("Discard changes?")) return;
  session.value = cancelGraphEdit(session.value);
  interaction.selection = emptyGraphSelection();
  validationErrors.value = [];
  paletteType.value = null;
}

async function autoLayout() {
  const graph = draftGraph.value;
  if (!graph) return;
  const startedAt = performance.now();
  const result = await layoutCoordinator.layout(graph);
  layoutTimeMs.value = performance.now() - startedAt;
  if (result.status === "applied") {
    applyCommand({ graph: result.graph as NetworkGraph, changed: true });
  } else if (result.status === "error") {
    validationErrors.value = [
      { targetType: "graph", targetId: "layout", code: "LAYOUT_ERROR", message: result.message },
    ];
  }
}

function exportDraft(receiver: { value: string }) {
  const graph = draftGraph.value;
  if (graph) receiver.value = exportGraph(graph);
}

function importDraft(json: string) {
  const result = importGraph(json);
  if (result.success) {
    applyCommand({ graph: result.graph as NetworkGraph, changed: true });
  } else {
    validationErrors.value = result.errors.map((message, index) => ({
      targetType: "graph",
      targetId: "import",
      code: `IMPORT_${String(index)}`,
      message,
    }));
  }
}

function setSelection(selection: GraphSelection) {
  interaction.selection = selection;
}
</script>

<template>
  <GraphEditorView
    v-if="editMode && laidOutDraftGraph"
    :can-redo="session.future.length > 0"
    :can-undo="session.past.length > 0"
    :debug="{ historyEntries: session.past.length + session.future.length, layoutTimeMs }"
    :dirty="session.dirty"
    :graph="laidOutDraftGraph"
    :interaction="interaction"
    :palette-type="paletteType"
    :saving="saving"
    :validation-errors="validationErrors"
    @auto-layout="autoLayout"
    @cancel="cancelDraft"
    @canvas-add="addDraftNode"
    @connect-nodes="connectDraftNodes"
    @copy="copyDraftSelection"
    @delete-selection="deleteSelection"
    @duplicate="
      copyDraftSelection();
      pasteDraftSelection();
    "
    @export-graph="exportDraft"
    @group="groupDraftSelection"
    @import-graph="importDraft"
    @move-group="(groupId) => draftGraph && applyCommand(moveGroup(draftGraph, groupId, { x: 40, y: 40 }))"
    @node-move="
      (nodeId, position) => draftGraph && applyCommand(moveSelection(draftGraph, nodeId, position, interaction.selection))
    "
    @palette-change="paletteType = $event"
    @paste="pasteDraftSelection"
    @redo="session = redoGraphEdit(session)"
    @save="saveDraft"
    @selection-change="setSelection"
    @undo="session = undoGraphEdit(session)"
    @update-node="
      (nodeId, label, description) => {
        const node = draftGraph?.nodes.find((candidate) => candidate.id === nodeId);
        if (node && draftGraph)
          applyCommand(updateNode(draftGraph, nodeId, { label, metadata: { ...node.metadata, description } }));
      }
    "
    @validate="validateDraft"
  />
  <GraphViewerView
    v-else
    :connection-state="realtime.connectionState.value"
    :get-node-presentation="getNetworkNodePresentation"
    :graph="laidOutSavedGraph"
    :interaction="interaction"
    :is-node-stale="realtime.isNodeStale"
    :route-query="routeQuery"
    :runtime="realtime.runtime.value"
    :selected-metric-history="realtime.selectedMetricHistory.value"
    @destination-change="interaction.destinationNodeId = $event"
    @edge-hover="interaction.hoveredEdgeId = $event"
    @edit="enterEditMode"
    @node-hover="interaction.hoveredNodeId = $event"
    @node-select="selectNode"
    @route-clear="clearRoute"
    @route-search="searchRoute"
    @source-change="interaction.sourceNodeId = $event"
  />
</template>
