<script setup lang="ts">
import BaseBadge from "../atoms/BaseBadge.vue";
import type { AtomicTone } from "../types";

withDefaults(
  defineProps<{
    label: string;
    value: string | number;
    helper?: string;
    trend?: string;
    trendTone?: AtomicTone;
  }>(),
  {
    trendTone: "success",
  }
);
</script>

<template>
  <article class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
    <div class="flex items-start justify-between gap-4">
      <div class="grid gap-2">
        <p class="m-0 text-sm font-medium text-slate-500">{{ label }}</p>
        <strong class="text-2xl font-bold text-slate-950">{{ value }}</strong>
      </div>
      <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <slot name="icon">#</slot>
      </div>
    </div>
    <div v-if="trend || helper" class="mt-5 flex items-center gap-2 text-sm">
      <BaseBadge v-if="trend" :tone="trendTone" size="sm">{{ trend }}</BaseBadge>
      <span v-if="helper" class="text-slate-500">{{ helper }}</span>
    </div>
  </article>
</template>
