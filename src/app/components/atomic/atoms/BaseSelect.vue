<script setup lang="ts">
import { computed } from "vue";

import type { AtomicOption, AtomicRadius, AtomicSize, AtomicState } from "../types";

const model = defineModel<string | null>();

const props = withDefaults(
  defineProps<{
    id?: string;
    name?: string;
    options: AtomicOption[];
    placeholder?: string;
    size?: AtomicSize;
    radius?: AtomicRadius;
    state?: AtomicState;
    disabled?: boolean;
    required?: boolean;
    ariaLabel?: string;
    ariaDescribedby?: string;
  }>(),
  {
    size: "md",
    radius: "md",
    state: "idle",
    disabled: false,
    required: false,
  }
);

const sizeClass = computed(() => {
  const classes: Record<AtomicSize, string> = {
    sm: "h-8 pl-2.5 pr-8 text-sm",
    md: "h-10 pl-3 pr-9 text-sm",
    lg: "h-12 pl-4 pr-10 text-base",
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

const stateClass = computed(() =>
  props.state === "invalid"
    ? "border-error focus:border-error focus:ring-red-500/20"
    : "border-slate-300 focus:border-primary focus:ring-blue-500/20"
);
</script>

<template>
  <select
    v-model="model"
    class="w-full appearance-none border bg-white text-slate-900 transition disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 disabled:opacity-70 focus:outline-none focus:ring-2"
    :class="[sizeClass, radiusClass, stateClass]"
    :id="id"
    :name="name"
    :disabled="disabled"
    :required="required"
    :aria-label="ariaLabel"
    :aria-describedby="ariaDescribedby"
    :aria-invalid="state === 'invalid' ? 'true' : undefined"
  >
    <option v-if="placeholder" value="" disabled>
      {{ placeholder }}
    </option>
    <option
      v-for="option in options"
      :key="option.value"
      :value="option.value"
      :disabled="option.disabled"
    >
      {{ option.label }}
    </option>
  </select>
</template>
