<script setup lang="ts">
import { computed } from "vue";

import type { AtomicSize } from "../types";

const props = withDefaults(
  defineProps<{
    label?: string;
    size?: AtomicSize;
  }>(),
  {
    label: "Loading",
    size: "md",
  }
);

const sizeClass = computed(() => {
  const classes: Record<AtomicSize, string> = {
    sm: "h-4 w-4 border-2",
    md: "h-6 w-6 border-2",
    lg: "h-8 w-8 border-[3px]",
  };

  return classes[props.size];
});
</script>

<template>
  <span
    class="inline-block animate-spin rounded-full border-slate-200 border-t-primary"
    :class="sizeClass"
    role="status"
    :aria-label="label"
  />
</template>
