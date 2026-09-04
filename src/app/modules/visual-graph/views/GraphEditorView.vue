<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { Connection } from "@vue-flow/core";

import { BaseBadge, BaseButton, BaseCard, BaseInput, BaseTextarea } from "@/components/atomic";

import GraphCanvas from "../components/GraphCanvas.vue";
import { emptyGraphSelection, type GraphDocument, type GraphPosition, type GraphSelection } from "../model/graph";
import type { GraphInteractionState } from "../model/graphInteraction";
import type { GraphValidationError } from "../editing/graphValidation";
import { useGraphEditorShortcuts } from "../editing/useGraphEditorShortcuts";
import {
  getNetworkNodePresentation,
  type NetworkEdgeMetadata,
  type NetworkNodeMetadata,
  type NetworkNodeType,
} from "../network/networkGraph";

const props = defineProps<{
  graph: GraphDocument<NetworkNodeType, NetworkNodeMetadata, NetworkEdgeMetadata>;
  interaction: GraphInteractionState;
  dirty: boolean;
  paletteType: NetworkNodeType | null;
  validationErrors: readonly GraphValidationError[];
  saving: boolean;
  canUndo: boolean;
  canRedo: boolean;
  debug: { historyEntries: number; layoutTimeMs: number };
}>();

const emit = defineEmits<{
  paletteChange: [type: NetworkNodeType | null];
  canvasAdd: [position: GraphPosition];
  nodeMove: [nodeId: string, position: GraphPosition];
  connectNodes: [connection: Connection];
  selectionChange: [selection: GraphSelection];
  updateNode: [nodeId: string, label: string, description: string];
  deleteSelection: [];
  validate: [];
  save: [];
  cancel: [];
  undo: [];
  redo: [];
  copy: [];
  paste: [];
  duplicate: [];
  group: [];
  autoLayout: [];
  moveGroup: [groupId: string];
  exportGraph: [receiver: { value: string }];
  importGraph: [json: string];
}>();

const transferJson = ref("");
const canvasDebug = ref({ renderCount: 0, zoom: 1 });

const selectedNode = computed(() => props.graph.nodes.find((node) => node.id === props.interaction.selection.nodeIds[0]));
const selectedEdge = computed(() => props.graph.edges.find((edge) => edge.id === props.interaction.selection.edgeIds[0]));
const selectedGroup = computed(() => props.graph.groups?.find((group) => group.id === props.interaction.selection.groupIds[0]));

const nodeLabel = ref("");
const nodeDescription = ref("");
watch(
  selectedNode,
  (node) => {
    nodeLabel.value = node?.label ?? "";
    nodeDescription.value = node?.metadata.description ?? "";
  },
  { immediate: true }
);

function commitNodeMetadata() {
  const node = selectedNode.value;
  if (!node) return;
  if (nodeLabel.value !== node.label || nodeDescription.value !== (node.metadata.description ?? "")) {
    emit("updateNode", node.id, nodeLabel.value, nodeDescription.value);
  }
}

useGraphEditorShortcuts({
  undo: () => emit("undo"),
  redo: () => emit("redo"),
  copy: () => emit("copy"),
  paste: () => emit("paste"),
  duplicate: () => emit("duplicate"),
  remove: () => emit("deleteSelection"),
  clearSelection: () => emit("selectionChange", emptyGraphSelection()),
});

function onCanvasClick(position: GraphPosition, handled: { value: boolean }) {
  if (!props.paletteType) return;
  emit("canvasAdd", position);
  handled.value = true;
}

function exportToTextarea() {
  const receiver = { value: "" };
  emit("exportGraph", receiver);
  transferJson.value = receiver.value;
}

const paletteTypes: readonly NetworkNodeType[] = ["router", "firewall", "server"];
</script>

<template>
  <div class="grid gap-5">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="m-0 text-2xl font-black text-slate-900">Topology Editor</h1>
        <p class="mt-2 text-sm text-slate-500">
          Build a draft topology. Routing and network policy validation remain external responsibilities.
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <BaseBadge v-if="dirty" tone="warning">Unsaved changes</BaseBadge>
        <BaseButton variant="outline" @click="emit('validate')">Validate</BaseButton>
        <BaseButton :disabled="!dirty || saving" @click="emit('save')">
          {{ saving ? "Saving…" : "Save" }}
        </BaseButton>
        <BaseButton variant="ghost" @click="emit('cancel')">Cancel</BaseButton>
      </div>
    </div>

    <div class="flex flex-wrap gap-2">
      <BaseButton size="sm" variant="outline" :disabled="!canUndo" @click="emit('undo')">Undo</BaseButton>
      <BaseButton size="sm" variant="outline" :disabled="!canRedo" @click="emit('redo')">Redo</BaseButton>
      <BaseButton size="sm" variant="outline" @click="emit('copy')">Copy</BaseButton>
      <BaseButton size="sm" variant="outline" @click="emit('paste')">Paste</BaseButton>
      <BaseButton size="sm" variant="outline" @click="emit('duplicate')">Duplicate</BaseButton>
      <BaseButton size="sm" variant="outline" @click="emit('group')">Group</BaseButton>
      <BaseButton size="sm" variant="outline" @click="emit('autoLayout')">Auto layout</BaseButton>
    </div>

    <div class="grid gap-5 xl:grid-cols-[220px_minmax(0,1fr)_300px]">
      <BaseCard>
        <template #header>
          <h2 class="m-0 text-lg font-bold text-slate-900">Device palette</h2>
          <p class="m-0 mt-1 text-sm text-slate-500">Choose a type, then click the canvas.</p>
        </template>
        <div class="grid gap-2">
          <button
            v-for="type in paletteTypes"
            :key="type"
            class="flex items-center gap-3 rounded-md border p-3 text-left"
            :class="paletteType === type ? 'border-blue-600 bg-blue-50' : 'border-slate-200 bg-white'"
            type="button"
            @click="emit('paletteChange', paletteType === type ? null : type)"
          >
            <span
              class="grid h-9 w-9 place-items-center rounded-md text-sm font-black text-white"
              :style="{ backgroundColor: getNetworkNodePresentation(type).color }"
            >
              {{ getNetworkNodePresentation(type).icon }}
            </span>
            <strong class="text-sm text-slate-900">{{ getNetworkNodePresentation(type).typeLabel }}</strong>
          </button>
        </div>
        <p class="mb-0 mt-4 text-xs text-slate-500">
          Drag nodes to move them. Drag from a node handle to another node to connect.
        </p>
        <div v-if="graph.groups?.length" class="mt-4 grid gap-2 border-t border-slate-200 pt-4">
          <strong class="text-xs text-slate-500">Groups</strong>
          <button
            v-for="group in graph.groups"
            :key="group.id"
            class="rounded-md border border-slate-200 p-2 text-left text-sm"
            type="button"
            @click="emit('selectionChange', { nodeIds: [], edgeIds: [], groupIds: [group.id] })"
          >
            {{ group.name }} · {{ group.childNodeIds.length }}
          </button>
        </div>
      </BaseCard>

      <GraphCanvas
        :editable="true"
        :get-node-presentation="getNetworkNodePresentation"
        :graph="graph"
        :interaction="interaction"
        :validation-errors="validationErrors"
        @canvas-click="onCanvasClick"
        @connect-nodes="emit('connectNodes', $event)"
        @debug-change="canvasDebug = $event"
        @edge-hover="() => undefined"
        @edge-select="emit('selectionChange', { nodeIds: [], edgeIds: [$event], groupIds: [] })"
        @multi-selection-change="
          (nodeIds, edgeIds) => emit('selectionChange', { nodeIds: [...nodeIds], edgeIds: [...edgeIds], groupIds: [] })
        "
        @node-hover="() => undefined"
        @node-move="(nodeId, position) => emit('nodeMove', nodeId, position)"
        @node-select="
          emit('selectionChange', $event ? { nodeIds: [$event], edgeIds: [], groupIds: [] } : emptyGraphSelection())
        "
      />

      <div class="grid content-start gap-5">
        <BaseCard>
          <template #header>
            <h2 class="m-0 text-lg font-bold text-slate-900">Selection</h2>
            <p class="m-0 mt-1 text-sm text-slate-500">Edit node metadata or remove the selected element.</p>
          </template>
          <div v-if="selectedNode" class="grid gap-4">
            <label class="grid gap-2 text-sm font-semibold text-slate-900">
              Display name
              <BaseInput v-model="nodeLabel" aria-label="Display name" @blur="commitNodeMetadata" />
            </label>
            <label class="grid gap-2 text-sm font-semibold text-slate-900">
              Description
              <BaseInput v-model="nodeDescription" aria-label="Description" @blur="commitNodeMetadata" />
            </label>
            <p class="m-0 text-xs text-slate-500">{{ selectedNode.id }} · {{ selectedNode.type }}</p>
            <BaseButton tone="error" @click="emit('deleteSelection')">Delete node</BaseButton>
          </div>
          <div v-else-if="selectedEdge" class="grid gap-3 text-sm">
            <p class="m-0 text-slate-900">{{ selectedEdge.sourceNodeId }} → {{ selectedEdge.targetNodeId }}</p>
            <p class="m-0 text-xs text-slate-500">
              {{ selectedEdge.sourcePortId ?? "default" }} → {{ selectedEdge.targetPortId ?? "default" }}
            </p>
            <BaseButton tone="error" @click="emit('deleteSelection')">Delete edge</BaseButton>
          </div>
          <div v-else-if="interaction.selection.groupIds[0]" class="grid gap-2">
            <p class="m-0 text-sm text-slate-900">{{ selectedGroup?.name }}</p>
            <BaseButton
              variant="outline"
              @click="emit('moveGroup', interaction.selection.groupIds[0] ?? '')"
            >
              Move group +40
            </BaseButton>
            <BaseButton tone="error" @click="emit('deleteSelection')">Ungroup</BaseButton>
          </div>
          <p v-else class="m-0 text-sm text-slate-500">Select a node, edge, or group.</p>
        </BaseCard>

        <BaseCard>
          <template #header>
            <h2 class="m-0 text-lg font-bold text-slate-900">Validation</h2>
            <p class="m-0 mt-1 text-sm text-slate-500">Structural checks plus external validation results.</p>
          </template>
          <ul v-if="validationErrors.length" class="m-0 grid gap-2 pl-5 text-sm text-red-700">
            <li v-for="error in validationErrors" :key="`${error.code}-${error.targetId}`">
              {{ error.message }} ({{ error.targetId }})
            </li>
          </ul>
          <p v-else class="m-0 text-sm text-slate-500">No validation errors.</p>
        </BaseCard>

        <BaseCard>
          <template #header>
            <h2 class="m-0 text-lg font-bold text-slate-900">Import / Export</h2>
            <p class="m-0 mt-1 text-sm text-slate-500">Versioned graph JSON. Import stays in draft until Save.</p>
          </template>
          <div class="grid gap-2">
            <BaseTextarea v-model="transferJson" aria-label="Graph transfer JSON" :rows="6" />
            <div class="flex gap-2">
              <BaseButton size="sm" variant="outline" @click="exportToTextarea">Export JSON</BaseButton>
              <BaseButton size="sm" :disabled="!transferJson.trim()" @click="emit('importGraph', transferJson)">
                Import preview
              </BaseButton>
            </div>
          </div>
        </BaseCard>

        <BaseCard>
          <template #header>
            <h2 class="m-0 text-lg font-bold text-slate-900">Performance debug</h2>
            <p class="m-0 mt-1 text-sm text-slate-500">Development baseline signals.</p>
          </template>
          <dl class="m-0 grid grid-cols-2 gap-2 text-xs">
            <dt>Nodes</dt>
            <dd class="m-0">{{ graph.nodes.length }}</dd>
            <dt>Edges</dt>
            <dd class="m-0">{{ graph.edges.length }}</dd>
            <dt>Viewport</dt>
            <dd class="m-0">{{ graph.nodes.length >= 500 ? "culled" : "all" }}</dd>
            <dt>Zoom</dt>
            <dd class="m-0">{{ canvasDebug.zoom.toFixed(2) }}</dd>
            <dt>Canvas renders</dt>
            <dd class="m-0">{{ canvasDebug.renderCount }}</dd>
            <dt>History</dt>
            <dd class="m-0">{{ debug.historyEntries }}</dd>
            <dt>Layout</dt>
            <dd class="m-0">{{ debug.layoutTimeMs.toFixed(1) }} ms</dd>
          </dl>
        </BaseCard>
      </div>
    </div>
  </div>
</template>
