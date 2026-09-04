<script setup lang="ts">
defineProps<{
  error: Error | null;
  isEmpty: boolean;
  isPending: boolean;
}>();
</script>

<template>
  <div v-if="isPending" class="widget-data-state">Loading widget data…</div>
  <div v-else-if="error" class="widget-data-state widget-data-state--error">Widget data unavailable</div>
  <div v-else-if="isEmpty" class="widget-data-state">No widget data</div>
  <slot v-else />
</template>
