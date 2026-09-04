<script setup lang="ts">
import type { LoadState, StoreFailure } from "@store/types";

import EmptyState from "./EmptyState.vue";
import ErrorState from "./ErrorState.vue";
import LoadingState from "./LoadingState.vue";

withDefaults(
  defineProps<{
    status: LoadState;
    failure?: StoreFailure | null;
    empty?: boolean;
    emptyTitle?: string;
    emptyDescription?: string;
    loadingTitle?: string;
    loadingDescription?: string;
  }>(),
  {
    empty: false,
    emptyTitle: "No data",
    emptyDescription: "There is nothing to show yet.",
    loadingTitle: "Loading",
    loadingDescription: "Preparing data.",
  }
);

defineEmits<{
  retry: [];
}>();
</script>

<template>
  <LoadingState
    v-if="status === 'loading'"
    :title="loadingTitle"
    :description="loadingDescription"
  />

  <ErrorState
    v-else-if="status === 'error' && failure"
    :code="failure.code"
    :kind="failure.kind"
    :message="failure.message"
    :origin="failure.origin"
    @retry="$emit('retry')"
  />

  <EmptyState
    v-else-if="empty"
    :title="emptyTitle"
    :description="emptyDescription"
  />

  <slot v-else />
</template>

