<script setup lang="ts">
import type { AtomicState } from "../types";

withDefaults(
  defineProps<{
    id: string;
    label: string;
    description?: string;
    error?: string;
    required?: boolean;
  }>(),
  {
    required: false,
  }
);

defineSlots<{
  default(props: {
    id: string;
    describedby?: string;
    state: AtomicState;
  }): unknown;
}>();
</script>

<template>
  <div class="grid gap-1.5">
    <label class="inline-flex items-center gap-1 text-sm font-semibold text-slate-900" :for="id">
      <span>{{ label }}</span>
      <span v-if="required" class="text-error">*</span>
    </label>
    <slot
      :id="id"
      :describedby="error ? `${id}-error` : description ? `${id}-description` : undefined"
      :state="error ? 'invalid' : 'idle'"
    />
    <p
      v-if="description && !error"
      :id="`${id}-description`"
      class="m-0 text-xs text-slate-500"
    >
      {{ description }}
    </p>
    <p v-if="error" :id="`${id}-error`" class="m-0 text-xs text-error">
      {{ error }}
    </p>
  </div>
</template>
