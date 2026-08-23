<script setup lang="ts">
import { computed } from "vue";

import type { AtomicRadius, AtomicSize, AtomicTone } from "../types";

const props = withDefaults(
  defineProps<{
    type?: "button" | "submit" | "reset";
    variant?: "solid" | "outline" | "ghost";
    tone?: AtomicTone;
    size?: AtomicSize;
    radius?: AtomicRadius;
    disabled?: boolean;
  }>(),
  {
    type: "button",
    variant: "solid",
    tone: "primary",
    size: "md",
    radius: "md",
    disabled: false,
  }
);

const sizeClass = computed(() => {
  const classes: Record<AtomicSize, string> = {
    sm: "h-8 px-3 text-sm",
    md: "h-10 px-4 text-sm",
    lg: "h-12 px-5 text-base",
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
  if (props.tone === "primary") {
    if (props.variant === "outline") {
      return "border-primary text-primary hover:bg-primary/10";
    }

    if (props.variant === "ghost") {
      return "border-transparent text-primary hover:bg-primary/10";
    }

    return "border-primary bg-primary text-white hover:opacity-90";
  }

  if (props.tone === "error") {
    if (props.variant === "outline") {
      return "border-error text-error hover:bg-error/10";
    }

    if (props.variant === "ghost") {
      return "border-transparent text-error hover:bg-error/10";
    }

    return "border-error bg-error text-white hover:opacity-90";
  }

  return props.variant === "solid"
    ? "border-slate-900 bg-slate-900 text-white hover:bg-slate-800"
    : "border-slate-300 bg-white text-slate-900 hover:bg-slate-50";
});
</script>

<template>
  <button
    class="inline-flex items-center justify-center gap-2 border font-semibold leading-none transition disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30"
    :class="[sizeClass, radiusClass, toneClass]"
    :type="type"
    :disabled="disabled"
  >
    <slot />
  </button>
</template>
