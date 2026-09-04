<script setup lang="ts">
const model = defineModel<boolean>({ default: false });

withDefaults(
  defineProps<{
    id?: string;
    name?: string;
    label?: string;
    description?: string;
    disabled?: boolean;
    required?: boolean;
  }>(),
  {
    disabled: false,
    required: false,
  }
);
</script>

<template>
  <label class="flex items-start gap-2 text-sm text-slate-800">
    <input
      v-model="model"
      class="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary transition focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50"
      :id="id"
      :name="name"
      type="checkbox"
      :disabled="disabled"
      :required="required"
    />
    <span v-if="label || description" class="grid gap-0.5">
      <span v-if="label" class="font-medium">{{ label }}</span>
      <span v-if="description" class="text-xs text-slate-500">
        {{ description }}
      </span>
    </span>
  </label>
</template>
