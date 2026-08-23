<script setup lang="ts">
import type { AtomicOption } from "../types";

const model = defineModel<string>();

withDefaults(
  defineProps<{
    items: AtomicOption[];
    ariaLabel?: string;
  }>(),
  {
    ariaLabel: "Tabs",
  }
);
</script>

<template>
  <div class="w-full">
    <div class="inline-flex rounded-lg bg-slate-100 p-1" role="tablist" :aria-label="ariaLabel">
      <button
        v-for="item in items"
        :key="item.value"
        class="rounded-md px-3 py-1.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 disabled:cursor-not-allowed disabled:opacity-50"
        :class="model === item.value ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-600 hover:text-slate-950'"
        type="button"
        role="tab"
        :aria-selected="model === item.value"
        :disabled="item.disabled"
        @click="model = item.value"
      >
        {{ item.label }}
      </button>
    </div>
    <div class="mt-4">
      <slot :active="model" />
    </div>
  </div>
</template>
