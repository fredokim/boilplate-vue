<script setup lang="ts">
import BaseButton from "../atoms/BaseButton.vue";
import SearchInput from "../atoms/SearchInput.vue";

const search = defineModel<string | null>("search");

withDefaults(
  defineProps<{
    title: string;
    description?: string;
    actionLabel?: string;
  }>(),
  {
    actionLabel: "Add new",
  }
);
</script>

<template>
  <div class="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
    <div>
      <h2 class="m-0 text-lg font-bold text-slate-950">{{ title }}</h2>
      <p v-if="description" class="m-0 mt-1 text-sm text-slate-500">{{ description }}</p>
    </div>
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
      <SearchInput v-model="search" class="w-full sm:w-64" placeholder="Search table" />
      <slot name="action">
        <BaseButton>{{ actionLabel }}</BaseButton>
      </slot>
    </div>
  </div>
</template>
