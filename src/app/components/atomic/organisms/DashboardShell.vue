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
      <!--
        `tabindex="0"` because this scrolls. A region that scrolls but cannot
        take focus is unreachable with a keyboard: there is nothing to put the
        caret on, so the arrow keys have nothing to scroll. It already has a
        role and a name from being <main>, which is what stops the added tab
        stop from being an unexplained one.
      -->
      <main class="min-w-0 flex-1 overflow-auto p-6" tabindex="0">
        <slot />
      </main>
    </div>
  </div>
</template>
