<script setup lang="ts">
import { computed } from "vue";

import type { AtomicSize } from "../types";

const props = withDefaults(
  defineProps<{
    src?: string;
    alt?: string;
    name?: string;
    size?: AtomicSize;
  }>(),
  {
    alt: "",
    size: "md",
  }
);

const sizeClass = computed(() => {
  const classes: Record<AtomicSize, string> = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
  };

  return classes[props.size];
});

const initials = computed(() => {
  if (!props.name) {
    return "?";
  }

  return props.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
});
</script>

<template>
  <span
    class="inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 font-semibold text-slate-700 ring-1 ring-slate-200"
    :class="sizeClass"
  >
    <img v-if="src" class="h-full w-full object-cover" :src="src" :alt="alt || name || ''" />
    <span v-else>{{ initials }}</span>
  </span>
</template>
