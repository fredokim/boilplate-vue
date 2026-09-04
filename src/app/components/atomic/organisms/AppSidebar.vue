<script setup lang="ts">
import type { AtomicOption } from "../types";

const active = defineModel<string>();

withDefaults(
  defineProps<{
    brand?: string;
    items: AtomicOption[];
  }>(),
  {
    brand: "DashStack",
  }
);
</script>

<template>
  <aside class="flex h-full w-64 flex-col border-r border-slate-200 bg-white">
    <div class="flex h-20 items-center px-6">
      <strong class="text-xl font-extrabold tracking-tight text-slate-950">
        <span class="text-primary">Dash</span>{{ brand.replace(/^Dash/i, "") }}
      </strong>
    </div>

    <nav class="grid gap-1 px-4 py-3">
      <button
        v-for="item in items"
        :key="item.value"
        class="flex h-11 items-center rounded-lg px-4 text-left text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
        :class="active === item.value ? 'bg-primary text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'"
        type="button"
        :disabled="item.disabled"
        @click="active = item.value"
      >
        <span class="mr-3 flex h-6 w-6 items-center justify-center rounded-md bg-current/10 text-xs">
          {{ item.label.slice(0, 1) }}
        </span>
        {{ item.label }}
      </button>
    </nav>

    <div class="mt-auto border-t border-slate-200 p-4">
      <slot name="footer">
        <button class="h-10 w-full rounded-lg text-left text-sm font-semibold text-slate-500 hover:text-slate-950">
          Settings
        </button>
      </slot>
    </div>
  </aside>
</template>
