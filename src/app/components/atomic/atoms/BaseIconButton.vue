<script setup lang="ts">
import { computed } from "vue";

import type { AtomicSize, AtomicTone } from "../types";

const props = withDefaults(
  defineProps<{
    label: string;
    tone?: AtomicTone;
    size?: AtomicSize;
    variant?: "plain" | "soft" | "outline";
    disabled?: boolean;
  }>(),
  {
    tone: "neutral",
    size: "md",
    variant: "soft",
    disabled: false,
  }
);

const sizeClass = computed(() => {
  const classes: Record<AtomicSize, string> = {
    sm: "h-8 w-8 text-sm",
    md: "h-10 w-10 text-base",
    lg: "h-12 w-12 text-lg",
  };

  return classes[props.size];
});

const toneClass = computed(() => {
  if (props.tone === "primary") {
    return props.variant === "outline"
      ? "border-primary text-primary hover:bg-primary/10"
      : "border-transparent bg-primary/10 text-primary hover:bg-primary/15";
  }

  if (props.tone === "error") {
    return props.variant === "outline"
      ? "border-error text-error hover:bg-error/10"
      : "border-transparent bg-error/10 text-error hover:bg-error/15";
  }

  return props.variant === "outline"
    ? "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
    : "border-transparent bg-slate-100 text-slate-700 hover:bg-slate-200";
});
</script>

<template>
  <button
    class="inline-flex items-center justify-center rounded-full border font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30"
    :class="[sizeClass, toneClass, variant === 'plain' ? 'bg-transparent' : '']"
    type="button"
    :aria-label="label"
    :disabled="disabled"
  >
    <slot />
  </button>
</template>
