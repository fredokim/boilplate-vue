<script setup lang="ts">
import BaseSkeleton from "../atoms/BaseSkeleton.vue";
import BaseSpinner from "../atoms/BaseSpinner.vue";

withDefaults(
  defineProps<{
    title?: string;
    description?: string;
    rows?: number;
    variant?: "skeleton" | "spinner";
  }>(),
  {
    title: "Loading",
    description: "Preparing data.",
    rows: 3,
    variant: "skeleton",
  }
);
</script>

<template>
  <section class="rounded-lg border border-slate-200 bg-white p-5">
    <div v-if="variant === 'spinner'" class="flex items-center justify-center gap-3 py-8">
      <BaseSpinner />
      <div>
        <h2 class="m-0 text-sm font-semibold text-slate-950">{{ title }}</h2>
        <p class="m-0 mt-1 text-sm text-slate-500">{{ description }}</p>
      </div>
    </div>

    <div v-else class="grid gap-4" role="status" :aria-label="title">
      <div class="grid gap-2">
        <BaseSkeleton class="h-5 w-40" />
        <BaseSkeleton class="h-4 w-64" />
      </div>
      <div class="grid gap-2">
        <BaseSkeleton
          v-for="index in rows"
          :key="index"
          class="h-10 w-full"
        />
      </div>
    </div>
  </section>
</template>

