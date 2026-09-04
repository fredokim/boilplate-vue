<script setup lang="ts">
import { computed } from "vue";

import type { AtomicRadius, AtomicState } from "../types";

const model = defineModel<string | null>();

const props = withDefaults(
  defineProps<{
    id?: string;
    name?: string;
    placeholder?: string;
    rows?: number;
    radius?: AtomicRadius;
    state?: AtomicState;
    disabled?: boolean;
    readonly?: boolean;
    required?: boolean;
    ariaLabel?: string;
    ariaDescribedby?: string;
  }>(),
  {
    rows: 4,
    radius: "md",
    state: "idle",
    disabled: false,
    readonly: false,
    required: false,
  }
);

const radiusClass = computed(() => {
  const classes: Record<AtomicRadius, string> = {
    sm: "rounded",
    md: "rounded-md",
    lg: "rounded-lg",
    full: "rounded-2xl",
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
  <textarea
    v-model="model"
    class="w-full resize-y border px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 disabled:opacity-70 focus:outline-none focus:ring-2"
    :class="[radiusClass, stateClass]"
    :id="id"
    :name="name"
    :placeholder="placeholder"
    :rows="rows"
    :disabled="disabled"
    :readonly="readonly"
    :required="required"
    :aria-label="ariaLabel"
    :aria-describedby="ariaDescribedby"
    :aria-invalid="state === 'invalid' ? 'true' : undefined"
  />
</template>
