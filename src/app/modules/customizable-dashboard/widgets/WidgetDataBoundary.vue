<script setup lang="ts">
import { computed } from "vue";

import { describeFailure } from "@core/result/failureStatus";

/**
 * Says which failure this is.
 *
 * Every error used to render the same four words, "Widget data unavailable",
 * whether the device was offline, the session had ended, or the server had
 * answered in a shape the page cannot read. Those need different things from
 * the reader -- wait, sign in, tell someone -- and the widget was telling them
 * apart internally and then throwing the distinction away at the last step.
 */
const props = defineProps<{
  error: Error | null;
  isEmpty: boolean;
  isPending: boolean;
}>();

/** Offered only where trying again could plausibly work. */
const emit = defineEmits<{ retry: [] }>();

const status = computed(() => (props.error ? describeFailure(props.error) : null));
</script>

<template>
  <div v-if="isPending" class="widget-data-state">Loading widget data…</div>
  <div
    v-else-if="status"
    class="widget-data-state"
    :class="`widget-data-state--${status.tone}`"
    role="status"
  >
    <strong>{{ status.title }}</strong>
    <span class="widget-data-state__detail">{{ status.detail }}</span>
    <button v-if="status.retryable" class="widget-data-state__retry" type="button" @click="emit('retry')">
      Try again
    </button>
  </div>
  <div v-else-if="isEmpty" class="widget-data-state">No widget data</div>
  <slot v-else />
</template>
