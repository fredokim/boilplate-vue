<script setup lang="ts">
withDefaults(
  defineProps<{
    content: string;
    placement?: "top" | "bottom";
  }>(),
  {
    placement: "top",
  }
);
</script>

<template>
  <span class="group relative inline-flex">
    <slot />
    <span
      class="pointer-events-none absolute left-1/2 z-20 w-max max-w-64 -translate-x-1/2 rounded bg-slate-900 px-2 py-1 text-xs font-medium text-white opacity-0 shadow transition group-hover:opacity-100 group-focus-within:opacity-100"
      :class="placement === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'"
      role="tooltip"
    >
      {{ content }}
    </span>
  </span>
</template>
