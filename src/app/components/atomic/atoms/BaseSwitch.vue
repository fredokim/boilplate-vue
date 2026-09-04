<script setup lang="ts">
const model = defineModel<boolean>({ default: false });

withDefaults(
  defineProps<{
    id?: string;
    label?: string;
    description?: string;
    disabled?: boolean;
  }>(),
  {
    disabled: false,
  }
);
</script>

<template>
  <label class="inline-flex items-start gap-3 text-sm text-slate-800">
    <button
      class="relative mt-0.5 h-6 w-11 rounded-full transition disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30"
      :id="id"
      type="button"
      role="switch"
      :aria-checked="model"
      :disabled="disabled"
      :class="model ? 'bg-primary' : 'bg-slate-300'"
      @click="model = !model"
    >
      <span
        class="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition"
        :class="model ? 'translate-x-5' : 'translate-x-0'"
      />
    </button>
    <span v-if="label || description" class="grid gap-0.5">
      <span v-if="label" class="font-medium">{{ label }}</span>
      <span v-if="description" class="text-xs text-slate-500">{{ description }}</span>
    </span>
  </label>
</template>
