<script setup lang="ts">
import type { AtomicOption } from "../types";

const model = defineModel<string | null>();

withDefaults(
  defineProps<{
    name: string;
    options: AtomicOption[];
    direction?: "vertical" | "horizontal";
    disabled?: boolean;
  }>(),
  {
    direction: "vertical",
    disabled: false,
  }
);
</script>

<template>
  <div
    class="flex gap-3"
    :class="direction === 'horizontal' ? 'flex-row flex-wrap' : 'flex-col'"
    role="radiogroup"
  >
    <label
      v-for="option in options"
      :key="option.value"
      class="inline-flex items-center gap-2 text-sm text-slate-800"
      :class="disabled || option.disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'"
    >
      <input
        v-model="model"
        class="h-4 w-4 border-slate-300 text-primary transition focus:ring-2 focus:ring-blue-500/20"
        type="radio"
        :name="name"
        :value="option.value"
        :disabled="disabled || option.disabled"
      />
      <span class="font-medium">{{ option.label }}</span>
    </label>
  </div>
</template>
