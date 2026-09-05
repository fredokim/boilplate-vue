<script setup lang="ts" generic="TNodeType extends string, TNodeMetadata extends GraphMetadata, TEdgeMetadata extends GraphMetadata">
import { connectionStatus } from "@core/realtime/connectionStatus";
import { computed, onScopeDispose, ref, watch } from "vue";

import { BaseButton, BaseCard, BaseInput, BaseSelect } from "@/components/atomic";
import type { AtomicOption } from "@/components/atomic/types";

import GraphCanvas from "../components/GraphCanvas.vue";
import type { GraphDocument, GraphMetadata, GraphNodePresentationResolver } from "../model/graph";
import type { GraphInteractionState, GraphRouteQueryState } from "../model/graphInteraction";
import { createGraphSearchIndex, searchGraphIndex } from "../performance/graphSearchIndex";
import type { NodeRuntimeStatus, RealtimeConnectionState, RuntimeStoreSnapshot } from "../realtime/types";

const props = defineProps<{
  graph: GraphDocument<TNodeType, TNodeMetadata, TEdgeMetadata>;
  interaction: GraphInteractionState;
  routeQuery: GraphRouteQueryState;
  getNodePresentation: GraphNodePresentationResolver<TNodeType>;
  connectionState: RealtimeConnectionState;
  runtime: RuntimeStoreSnapshot;
  isNodeStale: (nodeId: string, thresholdMs?: number) => boolean;
  selectedMetricHistory: Record<string, number[]>;
}>();

/**
 * Three tones rather than "connected or not". A paused connection is working
 * as intended and must not be dressed as a warning, which is what every state
 * but `connected` used to get.
 */
const TONE_CLASS = {
  ok: "bg-green-100 text-green-800",
  busy: "bg-amber-100 text-amber-900",
  bad: "bg-red-100 text-red-900",
} as const;

const emit = defineEmits<{
  nodeSelect: [nodeId: string | null];
  nodeHover: [nodeId: string | null];
  edgeHover: [edgeId: string | null];
  sourceChange: [nodeId: string | null];
  destinationChange: [nodeId: string | null];
  routeSearch: [];
  routeClear: [];
  edit: [];
}>();

const canvasRef = ref<{ fitAll: () => void; focusNode: (id: string) => void; focusRoute: (ids: readonly string[]) => void } | null>(null);
const nodeQuery = ref("");
const runtimeFilter = ref<"all" | Exclude<NodeRuntimeStatus, "healthy" | "unknown">>("all");
const rates = ref({ received: 0, applied: 0 });
let previousTotals = { received: 0, applied: 0 };

const searchIndex = computed(() => createGraphSearchIndex(props.graph));
const matchingNodes = computed(() =>
  searchGraphIndex(searchIndex.value, nodeQuery.value)
    .slice(0, 8)
    .map((id) => props.graph.nodes.find((node) => node.id === id))
    .filter((node) => node !== undefined)
);
const selectedNode = computed(() => props.graph.nodes.find((node) => node.id === props.interaction.selection.nodeIds[0]));
const hoveredEdge = computed(() => props.graph.edges.find((edge) => edge.id === props.interaction.hoveredEdgeId));
const routeNodes = computed(
  () => props.interaction.activeRoute?.nodeIds.map((id) => props.graph.nodes.find((node) => node.id === id)).filter(Boolean) ?? []
);
const selectedRuntime = computed(() => (selectedNode.value ? props.runtime.nodes[selectedNode.value.id] : undefined));
const averageBatchSize = computed(() =>
  props.runtime.diagnostics.flushCount
    ? (props.runtime.diagnostics.totalBatchSize / props.runtime.diagnostics.flushCount).toFixed(1)
    : "0"
);

const nodeOptions = computed<AtomicOption[]>(() => props.graph.nodes.map((node) => ({ label: node.label, value: node.id })));
const runtimeFilterOptions: AtomicOption[] = [
  { label: "All", value: "all" },
  { label: "Warning", value: "warning" },
  { label: "Critical", value: "critical" },
  { label: "Offline", value: "offline" },
];

const rateTimer = setInterval(() => {
  const next = { received: props.runtime.diagnostics.received, applied: props.runtime.diagnostics.applied };
  rates.value = {
    received: next.received - previousTotals.received,
    applied: next.applied - previousTotals.applied,
  };
  previousTotals = next;
}, 1_000);
onScopeDispose(() => clearInterval(rateTimer));

watch(
  () => props.interaction.activeRoute,
  (route) => {
    if (route) canvasRef.value?.focusRoute(route.nodeIds);
  }
);

// BaseSelect emits `string | null | undefined`; the container's contract is `string | null`.
function onSourceChange(nodeId: string | null | undefined) {
  emit("sourceChange", nodeId ?? null);
}

function onDestinationChange(nodeId: string | null | undefined) {
  emit("destinationChange", nodeId ?? null);
}

function selectAndFocusNode(nodeId: string) {
  emit("nodeSelect", nodeId);
  canvasRef.value?.focusNode(nodeId);
}

const debugEntries = computed<Record<string, string | number>>(() => ({
  connectionState: props.connectionState,
  eventsReceivedPerSecond: rates.value.received,
  eventsAppliedPerSecond: rates.value.applied,
  eventsReceived: props.runtime.diagnostics.received,
  eventsApplied: props.runtime.diagnostics.applied,
  coalesced: props.runtime.diagnostics.coalesced,
  duplicatesIgnored: props.runtime.diagnostics.duplicatesIgnored,
  staleIgnored: props.runtime.diagnostics.staleIgnored,
  unknownEntityIgnored: props.runtime.diagnostics.unknownEntities,
  dropped: props.runtime.diagnostics.dropped,
  bufferSize: props.runtime.diagnostics.bufferSize,
  flushCount: props.runtime.diagnostics.flushCount,
  averageBatchSize: averageBatchSize.value,
  runtimeStateCount: Object.keys(props.runtime.nodes).length + Object.keys(props.runtime.edges).length,
  reconnectCount: props.runtime.diagnostics.reconnectCount,
  lastResync: props.runtime.diagnostics.lastResync
    ? new Date(props.runtime.diagnostics.lastResync).toLocaleTimeString()
    : "—",
}));

function formatMetadataValue(value: unknown): string {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  if (value === null || value === undefined) return "—";
  return JSON.stringify(value);
}

const nodeMetadataEntries = computed<Record<string, unknown>>(() => {
  const node = selectedNode.value;
  if (!node) return {};
  return {
    name: node.label,
    type: node.type,
    ...node.metadata,
    runtimeStatus: selectedRuntime.value?.status ?? "unknown",
    lastUpdated: selectedRuntime.value ? new Date(selectedRuntime.value.lastUpdated).toLocaleTimeString() : "—",
    ...selectedRuntime.value?.metrics,
  };
});

const edgeMetadataEntries = computed<Record<string, unknown>>(() => {
  const edge = hoveredEdge.value;
  if (!edge) return {};
  return { id: edge.id, label: edge.label ?? "—", ...edge.metadata };
});
</script>

<template>
  <div class="grid gap-5">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="m-0 text-2xl font-black text-slate-900">Interactive Topology Explorer</h1>
        <p class="mt-2 text-sm text-slate-600">
          Search equipment, inspect metadata, and visualize routes calculated by an external engine.
        </p>
      </div>
      <div class="flex items-center gap-3">
        <span
          class="rounded-full px-3 py-1 text-xs font-bold"
          :class="TONE_CLASS[connectionStatus(connectionState).tone]"
          :title="connectionStatus(connectionState).detail"
          role="status"
        >
          Realtime: {{ connectionStatus(connectionState).label }}
        </span>
        <BaseButton @click="emit('edit')">Edit topology</BaseButton>
      </div>
    </div>

    <BaseCard>
      <template #header>
        <h2 class="m-0 text-lg font-bold text-slate-900">Runtime health</h2>
        <p class="m-0 mt-1 text-sm text-slate-600">
          Incremental counters from the realtime state store; filters dim nodes without removing topology.
        </p>
      </template>
      <div class="flex flex-wrap items-center gap-3">
        <span
          v-for="status in (['healthy', 'warning', 'critical', 'offline', 'unknown'] as const)"
          :key="status"
          class="rounded-md bg-slate-50 px-3 py-2 text-sm"
        >
          <strong class="capitalize">{{ status }}</strong> {{ runtime.summary[status] }}
        </span>
        <label class="ml-auto grid gap-1 text-xs font-semibold text-slate-600">
          Runtime filter
          <BaseSelect v-model="runtimeFilter" :options="runtimeFilterOptions" size="sm" aria-label="Runtime filter" />
        </label>
      </div>
    </BaseCard>

    <BaseCard>
      <template #header>
        <h2 class="m-0 text-lg font-bold text-slate-900">Explore topology</h2>
        <p class="m-0 mt-1 text-sm text-slate-600">Search by node name, id, or a primitive metadata value.</p>
      </template>
      <div class="grid gap-4 xl:grid-cols-[minmax(240px,1fr)_repeat(2,minmax(180px,0.7fr))_auto] xl:items-end">
        <div class="relative">
          <label class="grid gap-2 text-sm font-semibold text-slate-900">
            Find node
            <BaseInput v-model="nodeQuery" placeholder="API Server or api-server" aria-label="Find node" />
          </label>
          <div
            v-if="nodeQuery.trim()"
            class="absolute z-10 mt-1 grid max-h-56 w-full overflow-auto rounded-md border border-slate-200 bg-white p-1 shadow-lg"
            role="listbox"
          >
            <button
              v-for="node in matchingNodes"
              :key="node.id"
              class="rounded px-3 py-2 text-left text-sm hover:bg-slate-100"
              :aria-selected="false"
              role="option"
              type="button"
              @click="
                selectAndFocusNode(node.id);
                nodeQuery = node.label;
              "
            >
              <strong class="block text-slate-900">{{ node.label }}</strong>
              <span class="text-xs text-slate-600">{{ node.id }}</span>
            </button>
            <p v-if="!matchingNodes.length" class="m-0 px-3 py-2 text-sm text-slate-600">No matching nodes.</p>
          </div>
        </div>
        <label class="grid gap-2 text-sm font-semibold text-slate-900">
          Source
          <BaseSelect
            :model-value="interaction.sourceNodeId"
            :options="nodeOptions"
            placeholder="Select source"
            aria-label="Source"
            @update:model-value="onSourceChange"
          />
        </label>
        <label class="grid gap-2 text-sm font-semibold text-slate-900">
          Destination
          <BaseSelect
            :model-value="interaction.destinationNodeId"
            :options="nodeOptions"
            placeholder="Select destination"
            aria-label="Destination"
            @update:model-value="onDestinationChange"
          />
        </label>
        <BaseButton
          :disabled="!interaction.sourceNodeId || !interaction.destinationNodeId || routeQuery.status === 'loading'"
          @click="emit('routeSearch')"
        >
          {{ routeQuery.status === "loading" ? "Finding…" : "Find route" }}
        </BaseButton>
      </div>
      <p
        v-if="routeQuery.status === 'no-route' || routeQuery.status === 'error'"
        class="mb-0 mt-3 rounded-md px-3 py-2 text-sm"
        :class="routeQuery.status === 'error' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-800'"
        role="alert"
      >
        {{ routeQuery.message }}
      </p>
    </BaseCard>

    <div class="flex flex-wrap gap-2">
      <BaseButton size="sm" variant="outline" @click="canvasRef?.fitAll()">Fit all</BaseButton>
      <BaseButton
        size="sm"
        variant="outline"
        :disabled="!interaction.selection.nodeIds.length"
        @click="interaction.selection.nodeIds[0] && canvasRef?.focusNode(interaction.selection.nodeIds[0])"
      >
        Focus selected
      </BaseButton>
      <BaseButton
        size="sm"
        variant="outline"
        :disabled="!interaction.activeRoute"
        @click="interaction.activeRoute && canvasRef?.focusRoute(interaction.activeRoute.nodeIds)"
      >
        Focus route
      </BaseButton>
      <BaseButton
        size="sm"
        variant="ghost"
        :disabled="!interaction.activeRoute && routeQuery.status === 'idle'"
        @click="emit('routeClear')"
      >
        Clear route
      </BaseButton>
    </div>

    <div class="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
      <GraphCanvas
        ref="canvasRef"
        :edge-runtime="runtime.edges"
        :get-node-presentation="getNodePresentation"
        :graph="graph"
        :interaction="interaction"
        :is-node-stale="isNodeStale"
        :node-runtime="runtime.nodes"
        :runtime-filter="runtimeFilter"
        @edge-hover="emit('edgeHover', $event)"
        @node-hover="emit('nodeHover', $event)"
        @node-select="emit('nodeSelect', $event)"
      />
      <div class="grid content-start gap-5">
        <BaseCard>
          <template #header>
            <h2 class="m-0 text-lg font-bold text-slate-900">Route detail</h2>
            <p class="m-0 mt-1 text-sm text-slate-600">The ordered path returned by the route service.</p>
          </template>
          <ol v-if="interaction.activeRoute" class="m-0 grid list-none gap-2 p-0" aria-label="Ordered route">
            <li v-for="(node, index) in routeNodes" :key="node?.id ?? index">
              <button
                v-if="node"
                class="flex w-full items-center gap-3 rounded-md border border-slate-200 p-2 text-left hover:bg-slate-50"
                type="button"
                @click="selectAndFocusNode(node.id)"
              >
                <span class="grid h-7 w-7 place-items-center rounded-full bg-blue-50 text-xs font-black text-blue-600">
                  {{ index + 1 }}
                </span>
                <span>
                  <strong class="block text-sm text-slate-900">{{ node.label }}</strong>
                  <small class="text-slate-600">{{ getNodePresentation(node.type).typeLabel }}</small>
                </span>
              </button>
            </li>
          </ol>
          <p v-else class="m-0 text-sm text-slate-600">Search for a route to see its ordered path.</p>
        </BaseCard>

        <BaseCard>
          <template #header>
            <h2 class="m-0 text-lg font-bold text-slate-900">Node metadata</h2>
            <p class="m-0 mt-1 text-sm text-slate-600">Selection remains independent from the active route.</p>
          </template>
          <template v-if="selectedNode">
            <dl class="m-0 grid gap-3 text-sm">
              <div v-for="(value, key) in nodeMetadataEntries" :key="key">
                <dt class="font-semibold capitalize text-slate-600">{{ key }}</dt>
                <dd class="m-0 mt-1 break-words text-slate-900">{{ formatMetadataValue(value) }}</dd>
              </div>
            </dl>
            <div
              v-if="Object.keys(selectedMetricHistory).length"
              class="mt-4 border-t border-slate-200 pt-3 text-xs text-slate-600"
            >
              <p v-for="(values, name) in selectedMetricHistory" :key="name" class="m-0 mt-1">
                <strong>{{ name }}</strong
                >: {{ values.slice(-8).join(" → ") }}
              </p>
            </div>
          </template>
          <p v-else class="m-0 text-sm text-slate-600">No node selected.</p>
        </BaseCard>

        <BaseCard>
          <template #header>
            <h2 class="m-0 text-lg font-bold text-slate-900">Edge metadata</h2>
            <p class="m-0 mt-1 text-sm text-slate-600">Hover a connection to inspect it.</p>
          </template>
          <dl v-if="hoveredEdge" class="m-0 grid gap-3 text-sm">
            <div v-for="(value, key) in edgeMetadataEntries" :key="key">
              <dt class="font-semibold capitalize text-slate-600">{{ key }}</dt>
              <dd class="m-0 mt-1 break-words text-slate-900">{{ formatMetadataValue(value) }}</dd>
            </div>
          </dl>
          <p v-else class="m-0 text-sm text-slate-600">No edge hovered.</p>
        </BaseCard>

        <BaseCard>
          <template #header>
            <h2 class="m-0 text-lg font-bold text-slate-900">Realtime debug</h2>
            <p class="m-0 mt-1 text-sm text-slate-600">
              Development telemetry for buffering, ordering, and reconnect behavior.
            </p>
          </template>
          <dl class="m-0 grid gap-3 text-sm">
            <div v-for="(value, key) in debugEntries" :key="key">
              <dt class="font-semibold capitalize text-slate-600">{{ key }}</dt>
              <dd class="m-0 mt-1 break-words text-slate-900">{{ value }}</dd>
            </div>
          </dl>
        </BaseCard>
      </div>
    </div>
  </div>
</template>
