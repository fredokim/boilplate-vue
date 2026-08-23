<script setup lang="ts">
import type { BreadcrumbItem } from "@store/types";

defineProps<{
  items: BreadcrumbItem[];
}>();
</script>

<template>
  <nav class="flex items-center gap-2 text-sm text-slate-500" aria-label="Breadcrumb">
    <template v-for="(item, index) in items" :key="`${item.label}-${index}`">
      <a v-if="item.to" class="font-medium text-slate-600 hover:text-primary" :href="item.to">
        {{ item.label }}
      </a>
      <span v-else class="font-semibold text-slate-900">{{ item.label }}</span>
      <span v-if="index < items.length - 1" class="text-slate-300">/</span>
    </template>
  </nav>
</template>
