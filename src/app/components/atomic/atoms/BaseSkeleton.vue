<script setup lang="ts">
withDefaults(
  defineProps<{
    shape?: "line" | "circle" | "block";
  }>(),
  {
    shape: "line",
  }
);
</script>

<template>
  <div
    class="animate-pulse bg-slate-200"
    :class="[
      shape === 'circle' ? 'h-10 w-10 rounded-full' : '',
      shape === 'line' ? 'h-3 w-full rounded-full' : '',
      shape === 'block' ? 'h-24 w-full rounded-xl' : '',
    ]"
  />
</template>
