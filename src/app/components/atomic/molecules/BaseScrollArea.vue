<script setup lang="ts">
withDefaults(
  defineProps<{
    maxHeight?: string;
    orientation?: "both" | "horizontal" | "vertical";
  }>(),
  {
    maxHeight: "24rem",
    orientation: "vertical",
  }
);
</script>

<template>
  <div
    class="scroll-smooth rounded-md border border-slate-200 bg-white"
    :class="{
      'overflow-auto': orientation === 'both',
      'overflow-x-auto overflow-y-hidden': orientation === 'horizontal',
      'overflow-y-auto overflow-x-hidden': orientation === 'vertical',
    }"
    :style="{ maxHeight }"
  >
    <slot />
  </div>
</template>

