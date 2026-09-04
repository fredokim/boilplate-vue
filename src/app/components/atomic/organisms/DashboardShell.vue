<script setup lang="ts">
import AppSidebar from "./AppSidebar.vue";
import AppTopbar from "./AppTopbar.vue";
import type { AtomicOption } from "../types";

const active = defineModel<string>("active");
const search = defineModel<string | null>("search");

defineProps<{
  title: string;
  navItems: AtomicOption[];
}>();
</script>

<template>
  <div class="flex min-h-[720px] overflow-hidden rounded-2xl border border-slate-200 bg-background">
    <AppSidebar v-model="active" :items="navItems" />
    <div class="flex min-w-0 flex-1 flex-col">
      <AppTopbar v-model:search="search" :title="title">
        <template #breadcrumb>
          <slot name="breadcrumb" />
        </template>
      </AppTopbar>
      <main class="min-w-0 flex-1 overflow-auto p-6">
        <slot />
      </main>
    </div>
  </div>
</template>
