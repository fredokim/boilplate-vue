<script setup lang="ts">
import type { AtomicDropdownItem } from "../types";

defineProps<{
  label: string;
  items: AtomicDropdownItem[];
}>();

const emit = defineEmits<{
  select: [item: AtomicDropdownItem];
}>();
</script>

<template>
  <details class="relative inline-block">
    <summary
      class="inline-flex h-10 cursor-pointer list-none items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30"
    >
      {{ label }}
      <span class="text-xs text-slate-500">v</span>
    </summary>
    <div
      class="absolute right-0 z-30 mt-2 min-w-44 overflow-hidden rounded-md border border-slate-200 bg-white p-1 shadow-lg"
    >
      <button
        v-for="item in items"
        :key="item.value"
        class="flex w-full items-center rounded px-3 py-2 text-left text-sm transition disabled:cursor-not-allowed disabled:opacity-50"
        :class="item.danger ? 'text-error hover:bg-red-50' : 'text-slate-700 hover:bg-slate-50'"
        type="button"
        :disabled="item.disabled"
        @click="emit('select', item)"
      >
        {{ item.label }}
      </button>
    </div>
  </details>
</template>
