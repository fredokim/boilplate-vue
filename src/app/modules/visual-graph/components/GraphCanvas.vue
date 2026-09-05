<script setup lang="ts" generic="TNodeType extends string, TNodeMetadata extends GraphMetadata, TEdgeMetadata extends GraphMetadata">
import { computed, onUpdated, ref } from "vue";
import { MarkerType, Position, VueFlow, useVueFlow, type Connection, type Edge, type Node } from "@vue-flow/core";
import { Background, BackgroundVariant } from "@vue-flow/background";
import { Controls } from "@vue-flow/controls";
import "@vue-flow/core/dist/style.css";
import "@vue-flow/core/dist/theme-default.css";

import type {
  GraphDocument,
  GraphMetadata,
  GraphNodePresentationResolver,
  GraphPosition,
} from "../model/graph";
import type { GraphValidationError } from "../editing/graphValidation";
import { getGraphEdgeVisualState, getGraphNodeVisualState, type GraphInteractionState } from "../model/graphInteraction";
import GraphNodeCard, { type GraphNodeData } from "./GraphNodeCard.vue";
import type { EdgeRuntimeState, NodeRuntimeState, NodeRuntimeStatus } from "../realtime/types";
import { createRouteLookup, getGraphDetailLevel } from "../performance/graphViewAdapter";
import "./graphCanvas.scss";

const props = withDefaults(
  defineProps<{
    graph: GraphDocument<TNodeType, TNodeMetadata, TEdgeMetadata>;
    interaction: GraphInteractionState;
    getNodePresentation: GraphNodePresentationResolver<TNodeType>;
    editable?: boolean;
    validationErrors?: readonly GraphValidationError[];
    nodeRuntime?: Readonly<Record<string, NodeRuntimeState>>;
    edgeRuntime?: Readonly<Record<string, EdgeRuntimeState>>;
    runtimeFilter?: NodeRuntimeStatus | "all";
    isNodeStale?: (nodeId: string) => boolean;
  }>(),
  { editable: false, runtimeFilter: "all" }
);

const emit = defineEmits<{
  nodeSelect: [nodeId: string | null];
  nodeHover: [nodeId: string | null];
  edgeHover: [edgeId: string | null];
  nodeMove: [nodeId: string, position: GraphPosition];
  connectNodes: [connection: Connection];
  edgeSelect: [edgeId: string];
  canvasClick: [position: GraphPosition, handled: { value: boolean }];
  multiSelectionChange: [nodeIds: readonly string[], edgeIds: readonly string[]];
  debugChange: [metrics: { renderCount: number; zoom: number }];
}>();

const { fitView, screenToFlowCoordinate } = useVueFlow();

const zoom = ref(1);
const renderCount = ref(0);
const detailLevel = computed(() => getGraphDetailLevel(zoom.value));
const routeLookup = computed(() => createRouteLookup(props.interaction.activeRoute));
const invalidNodeIds = computed(
  () => new Set((props.validationErrors ?? []).filter((e) => e.targetType === "node").map((e) => e.targetId))
);
const invalidEdgeIds = computed(
  () => new Set((props.validationErrors ?? []).filter((e) => e.targetType === "edge").map((e) => e.targetId))
);

onUpdated(() => {
  renderCount.value += 1;
});

const nodes = computed<Node<GraphNodeData>[]>(() =>
  props.graph.nodes.map((node) => {
    const runtimeState = props.nodeRuntime?.[node.id];
    return {
      id: node.id,
      type: "graph-node",
      position: node.position,
      selected: props.interaction.selection.nodeIds.includes(node.id),
      draggable: props.editable,
      connectable: props.editable,
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      data: {
        label: node.label,
        presentation: props.getNodePresentation(node.type),
        visualState: getGraphNodeVisualState(node.id, props.interaction, routeLookup.value),
        editable: props.editable,
        validationError: invalidNodeIds.value.has(node.id),
        detailLevel: detailLevel.value,
        ...(runtimeState ? { runtimeState } : {}),
        runtimeStale: props.isNodeStale?.(node.id) ?? false,
        runtimeFiltered: props.runtimeFilter !== "all" && runtimeState?.status !== props.runtimeFilter,
      },
    };
  })
);

const edges = computed<Edge[]>(() =>
  props.graph.edges.map((edge) => {
    const visualState = getGraphEdgeVisualState(edge.id, props.interaction, routeLookup.value);
    const runtimeState = props.edgeRuntime?.[edge.id];
    const runtimeColor =
      runtimeState?.status === "disconnected" ? "#dc2626" : runtimeState?.status === "degraded" ? "#d97706" : "#94a3b8";
    const color = visualState.routeActive ? "#2563eb" : runtimeColor;
    return {
      id: edge.id,
      source: edge.sourceNodeId,
      target: edge.targetNodeId,
      label: detailLevel.value === "compact" || props.graph.edges.length > 1000 ? undefined : edge.label,
      animated: visualState.routeActive,
      selected: props.interaction.selection.edgeIds.includes(edge.id),
      class: [
        visualState.dimmed ? "graph-edge--dimmed" : "",
        visualState.hovered ? "graph-edge--hovered" : "",
        invalidEdgeIds.value.has(edge.id) ? "graph-edge--error" : "",
        runtimeState ? `graph-edge--runtime-${runtimeState.status}` : "",
      ].join(" "),
      markerEnd: { type: MarkerType.ArrowClosed, color },
      style: {
        stroke: color,
        strokeWidth: visualState.routeActive || visualState.hovered ? 3 : 2,
        ...(runtimeState?.status === "disconnected" ? { strokeDasharray: "6 4" } : {}),
      },
    };
  })
);

function onMoveEnd(payload: { flowTransform?: { zoom: number } }) {
  zoom.value = payload.flowTransform?.zoom ?? zoom.value;
  emit("debugChange", { renderCount: renderCount.value, zoom: zoom.value });
}

function onSelectionChange(payload: { nodes: Node[]; edges: Edge[] }) {
  emit(
    "multiSelectionChange",
    payload.nodes.map((node) => node.id),
    payload.edges.map((edge) => edge.id)
  );
}

function onPaneClick(event: MouseEvent) {
  const position = screenToFlowCoordinate({ x: event.clientX, y: event.clientY });
  const handled = { value: false };
  emit("canvasClick", position, handled);
  if (!handled.value) emit("nodeSelect", null);
}

defineExpose({
  fitAll: () => void fitView({ duration: 350, padding: 0.18 }),
  focusNode: (nodeId: string) => void fitView({ duration: 350, maxZoom: 1.35, nodes: [nodeId], padding: 1.5 }),
  focusRoute: (nodeIds: readonly string[]) =>
    void fitView({ duration: 400, maxZoom: 1.2, nodes: [...nodeIds], padding: 0.35 }),
});
</script>

<template>
  <div class="graph-canvas" aria-label="Network topology graph">
    <VueFlow
      :edges="edges"
      :nodes="nodes"
      :elements-selectable="true"
      :fit-view-on-init="true"
      :max-zoom="2"
      :min-zoom="0.4"
      :multi-selection-key-code="['Shift', 'Control', 'Meta']"
      :nodes-connectable="editable"
      :nodes-draggable="editable"
      :only-render-visible-elements="graph.nodes.length >= 500"
      :pan-on-drag="true"
      :selection-key-code="editable ? 'Shift' : null"
      :zoom-on-double-click="false"
      @connect="emit('connectNodes', $event)"
      @edge-click="emit('edgeSelect', $event.edge.id)"
      @edge-mouse-enter="emit('edgeHover', $event.edge.id)"
      @edge-mouse-leave="emit('edgeHover', null)"
      @move-end="onMoveEnd"
      @node-click="emit('nodeSelect', $event.node.id)"
      @node-drag-stop="emit('nodeMove', $event.node.id, $event.node.position)"
      @node-mouse-enter="emit('nodeHover', $event.node.id)"
      @node-mouse-leave="emit('nodeHover', null)"
      @pane-click="onPaneClick"
      @selection-change="onSelectionChange"
    >
      <template #node-graph-node="nodeProps">
        <GraphNodeCard :data="nodeProps.data" :selected="nodeProps.selected" />
      </template>
      <Background :variant="BackgroundVariant.Dots" color="#cbd5e1" :gap="20" :size="1" />
      <!--
        Vue Flow renders its zoom and fit buttons with an icon and no text, so
        a screen reader announces three unlabelled buttons. React Flow labels
        its own; this one does not, and the slots replace the icon rather than
        wrap it, so the label is added beside a redrawn icon.
      -->
      <Controls :show-interactive="false">
        <template #control-zoom-in>
          <span class="graph-canvas__control-label">Zoom in</span>
          <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </template>
        <template #control-zoom-out>
          <span class="graph-canvas__control-label">Zoom out</span>
          <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
            <path d="M5 12h14" />
          </svg>
        </template>
        <template #control-fit-view>
          <span class="graph-canvas__control-label">Fit the whole topology in view</span>
          <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
            <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
          </svg>
        </template>
      </Controls>
    </VueFlow>
  </div>
</template>
