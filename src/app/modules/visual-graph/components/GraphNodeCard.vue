<script setup lang="ts">
import { computed } from "vue";
import { Handle, Position } from "@vue-flow/core";

import type { GraphNodePresentation } from "../model/graph";
import type { GraphNodeVisualState } from "../model/graphInteraction";
import type { GraphDetailLevel } from "../performance/graphViewAdapter";
import type { NodeRuntimeState, NodeRuntimeStatus } from "../realtime/types";

export type GraphNodeData = {
  label: string;
  presentation: GraphNodePresentation;
  visualState: GraphNodeVisualState;
  editable: boolean;
  validationError: boolean;
  detailLevel: GraphDetailLevel;
  runtimeState?: NodeRuntimeState;
  runtimeStale: boolean;
  runtimeFiltered: boolean;
};

const props = defineProps<{ data: GraphNodeData; selected?: boolean }>();

const runtimeStatusIcon: Record<NodeRuntimeStatus, string> = {
  unknown: "?",
  healthy: "✓",
  warning: "!",
  critical: "×",
  offline: "○",
};

const status = computed<NodeRuntimeStatus>(() => props.data.runtimeState?.status ?? "unknown");
const routeRole = computed(() => props.data.visualState.routeRole);
const ariaLabel = computed(
  () => `${props.data.label}, ${status.value}${props.data.runtimeStale ? ", stale" : ""}`
);
</script>

<template>
  <div
    class="graph-node"
    :class="[
      selected ? 'graph-node--selected' : '',
      data.visualState.hovered ? 'graph-node--hovered' : '',
      data.visualState.dimmed ? 'graph-node--dimmed' : '',
      data.runtimeFiltered ? 'graph-node--runtime-filtered' : '',
      routeRole !== 'none' ? `graph-node--route graph-node--${routeRole}` : '',
      data.validationError ? 'graph-node--error' : '',
      `graph-node--runtime-${status}`,
      data.runtimeStale ? 'graph-node--runtime-stale' : '',
    ]"
    :aria-label="ariaLabel"
    :data-route-role="routeRole"
    :data-runtime-status="status"
  >
    <Handle
      class="graph-node__handle"
      id="input"
      :connectable="data.editable"
      :position="Position.Left"
      type="target"
    />
    <span class="graph-node__icon" :style="{ backgroundColor: data.presentation.color }">
      {{ data.presentation.icon }}
    </span>
    <span>
      <strong class="graph-node__label">{{ data.label }}</strong>
      <small v-if="data.detailLevel !== 'compact'" class="graph-node__type">
        {{ data.presentation.typeLabel }}
      </small>
    </span>
    <span v-if="routeRole === 'source' || routeRole === 'destination'" class="graph-node__route-role">
      {{ routeRole === "source" ? "Start" : "End" }}
    </span>
    <span
      v-if="data.detailLevel !== 'compact'"
      class="graph-node__runtime-badge"
      :class="`graph-node__runtime-badge--${status}`"
      :title="data.runtimeStale ? 'Runtime data is stale' : status"
    >
      <span aria-hidden="true">{{ data.runtimeStale ? "◷" : runtimeStatusIcon[status] }}</span>
      {{ data.runtimeStale ? "Stale" : status }}
    </span>
    <Handle
      class="graph-node__handle"
      id="output"
      :connectable="data.editable"
      :position="Position.Right"
      type="source"
    />
  </div>
</template>
