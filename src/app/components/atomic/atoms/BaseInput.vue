<script setup lang="ts">
import { computed } from "vue";

import type { AtomicRadius, AtomicSize, AtomicState } from "../types";

const model = defineModel<string | number | null>();

const props = withDefaults(
  defineProps<{
    id?: string;
    name?: string;
    type?: "text" | "password" | "email" | "search" | "tel" | "url" | "number";
    placeholder?: string;
    autocomplete?: string;
    size?: AtomicSize;
    radius?: AtomicRadius;
    state?: AtomicState;
    disabled?: boolean;
    readonly?: boolean;
    required?: boolean;
    ariaLabel?: string;
    ariaDescribedby?: string;
  }>(),
  {
    type: "text",
    size: "md",
    radius: "md",
    state: "idle",
    disabled: false,
    readonly: false,
    required: false,
  }
);

const sizeClass = computed(() => {
  const classes: Record<AtomicSize, string> = {
    sm: "h-8 px-2.5 text-sm",
    md: "h-10 px-3 text-sm",
    lg: "h-12 px-4 text-base",
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

const stateClass = computed(() => {
  if (props.state === "invalid") {
    return "border-error focus:border-error focus:ring-red-500/20";
  }

  if (props.state === "readonly" || props.readonly) {
    return "bg-slate-50 text-slate-700";
  }

  return "border-slate-300 bg-white focus:border-primary focus:ring-blue-500/20";
});
</script>

<template>
  <input
    v-model="model"
    class="w-full border text-slate-900 placeholder:text-slate-400 transition disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 disabled:opacity-70 focus:outline-none focus:ring-2"
    :class="[sizeClass, radiusClass, stateClass]"
    :id="id"
    :name="name"
    :type="type"
    :placeholder="placeholder"
    :autocomplete="autocomplete"
    :disabled="disabled"
    :readonly="readonly"
    :required="required"
    :aria-label="ariaLabel"
    :aria-describedby="ariaDescribedby"
    :aria-invalid="state === 'invalid' ? 'true' : undefined"
  />
</template>
