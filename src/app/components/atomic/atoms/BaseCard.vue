<script setup lang="ts">
withDefaults(
  defineProps<{
    padded?: boolean;
  }>(),
  {
    padded: true,
  }
);
</script>

<template>
  <article
    class="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
    :class="padded ? 'p-4' : ''"
  >
    <header v-if="$slots.header" class="mb-4 border-b border-slate-200 pb-3">
      <slot name="header" />
    </header>

    <section class="text-slate-700">
      <slot />
    </section>

    <footer v-if="$slots.footer" class="mt-4 flex justify-end border-t border-slate-200 pt-3">
      <slot name="footer" />
    </footer>
  </article>
</template>
