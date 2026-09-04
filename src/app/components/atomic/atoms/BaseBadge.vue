<script setup lang="ts">
import { computed } from "vue";

import type { AtomicRadius, AtomicSize, AtomicTone } from "../types";

const props = withDefaults(
  defineProps<{
    tone?: AtomicTone;
    size?: AtomicSize;
    radius?: AtomicRadius;
  }>(),
  {
    tone: "neutral",
    size: "md",
    radius: "full",
  }
);

const sizeClass = computed(() => {
  const classes: Record<AtomicSize, string> = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-xs",
    lg: "px-3 py-1.5 text-sm",
  };

  return classes[props.size];
});

const radiusClass = computed(() => {
  const classes: Record<AtomicRadius, string> = {
    sm: "rounded",
    md: "rounded-md",
    lg: "rounded-lg",
    full: "rounded-full",
  };

  return classes[props.radius];
});

const toneClass = computed(() => {
  const classes: Record<AtomicTone, string> = {
    neutral: "bg-slate-100 text-slate-700 ring-slate-200",
    primary: "bg-primary/10 text-primary ring-primary/20",
    success: "bg-success/10 text-success ring-success/20",
    warning: "bg-warning/10 text-warning ring-warning/20",
    error: "bg-error/10 text-error ring-error/20",
    info: "bg-info/10 text-info ring-info/20",
  };

  return classes[props.tone];
});
</script>

<template>
  <span
    class="inline-flex w-fit items-center gap-1 font-semibold leading-none ring-1 ring-inset"
    :class="[sizeClass, radiusClass, toneClass]"
  >
    <slot />
  </span>
</template>
