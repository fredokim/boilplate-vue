<script setup lang="ts">
import type { Component } from "vue";

import BaseModal from "../organisms/BaseModal.vue";

const open = defineModel<boolean>("open", { default: false });

withDefaults(
  defineProps<{
    component: Component;
    componentProps?: Record<string, unknown>;
    title?: string;
    description?: string;
    size?: "sm" | "md" | "lg" | "xl";
  }>(),
  {
    componentProps: () => ({}),
    size: "md",
  }
);
</script>

<template>
  <BaseModal
    v-model:open="open"
    :title="title"
    :description="description"
    :size="size"
  >
    <template #default="{ close }">
      <component :is="component" v-bind="componentProps" :close="close" />
    </template>
  </BaseModal>
</template>
