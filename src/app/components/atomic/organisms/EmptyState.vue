<script setup lang="ts">
import BaseButton from "../atoms/BaseButton.vue";

withDefaults(
  defineProps<{
    title?: string;
    description?: string;
    actionLabel?: string;
  }>(),
  {
    title: "No data",
    description: "There is nothing to show yet.",
  }
);

defineEmits<{
  action: [];
}>();
</script>

<template>
  <section
    class="grid place-items-center rounded-lg border border-dashed border-slate-300 bg-white px-6 py-10 text-center"
  >
    <div class="grid max-w-sm gap-3">
      <div
        class="mx-auto grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-sm font-bold text-slate-500"
        aria-hidden="true"
      >
        -
      </div>
      <div class="grid gap-1">
        <h2 class="m-0 text-base font-semibold text-slate-950">{{ title }}</h2>
        <p class="m-0 text-sm text-slate-500">{{ description }}</p>
      </div>
      <BaseButton
        v-if="actionLabel"
        class="mx-auto"
        type="button"
        variant="outline"
        tone="neutral"
        @click="$emit('action')"
      >
        {{ actionLabel }}
      </BaseButton>
    </div>
  </section>
</template>

