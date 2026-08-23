<script setup lang="ts">
import BaseInput from "./BaseInput.vue";

const model = defineModel<string | null>();

withDefaults(
  defineProps<{
    id?: string;
    placeholder?: string;
    disabled?: boolean;
  }>(),
  {
    placeholder: "Search",
    disabled: false,
  }
);
</script>

<template>
  <div class="relative">
    <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
      /
    </span>
    <BaseInput
      v-model="model"
      class="pl-9"
      type="search"
      :id="id"
      :placeholder="placeholder"
      :disabled="disabled"
      aria-label="Search"
    />
  </div>
</template>
