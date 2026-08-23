<script setup lang="ts">
import { computed } from "vue";

import BaseBadge from "../atoms/BaseBadge.vue";
import BaseButton from "../atoms/BaseButton.vue";

const props = withDefaults(
  defineProps<{
    title?: string;
    message: string;
    code?: string;
    origin?: "frontend" | "backend";
    kind?: string;
    actionLabel?: string;
  }>(),
  {
    title: "Something went wrong",
    actionLabel: "Try again",
  }
);

defineEmits<{
  retry: [];
}>();

const detailText = computed(() =>
  [props.code, props.origin, props.kind].filter(Boolean).join(" / ")
);
</script>

<template>
  <section
    class="rounded-lg border border-red-200 bg-red-50 p-5 text-red-900"
    role="alert"
  >
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div class="grid gap-2">
        <div class="flex flex-wrap items-center gap-2">
          <h2 class="m-0 text-base font-semibold">{{ title }}</h2>
          <BaseBadge v-if="origin" tone="error">{{ origin }}</BaseBadge>
        </div>
        <p class="m-0 text-sm text-red-800">{{ message }}</p>
        <p v-if="detailText" class="m-0 text-xs font-semibold uppercase text-red-500">
          {{ detailText }}
        </p>
      </div>

      <BaseButton
        v-if="actionLabel"
        type="button"
        tone="error"
        variant="outline"
        @click="$emit('retry')"
      >
        {{ actionLabel }}
      </BaseButton>
    </div>
  </section>
</template>

