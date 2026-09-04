<script setup lang="ts">
import BaseAvatar from "../atoms/BaseAvatar.vue";
import BaseIconButton from "../atoms/BaseIconButton.vue";
import SearchInput from "../atoms/SearchInput.vue";

const search = defineModel<string | null>("search");

withDefaults(
  defineProps<{
    title: string;
    userName?: string;
    userRole?: string;
    avatarSrc?: string;
  }>(),
  {
    userName: "Admin User",
    userRole: "Admin",
  }
);
</script>

<template>
  <header class="flex h-20 items-center justify-between border-b border-slate-200 bg-white px-6">
    <div class="grid gap-1">
      <h1 class="m-0 text-2xl font-bold text-slate-950">{{ title }}</h1>
      <slot name="breadcrumb" />
    </div>

    <div class="flex items-center gap-4">
      <SearchInput v-model="search" class="hidden w-72 md:block" placeholder="Search" />
      <BaseIconButton label="Notifications" variant="outline">!</BaseIconButton>
      <div class="flex items-center gap-3">
        <BaseAvatar :src="avatarSrc" :name="userName" />
        <div class="hidden text-right sm:block">
          <p class="m-0 text-sm font-semibold text-slate-950">{{ userName }}</p>
          <p class="m-0 text-xs text-slate-500">{{ userRole }}</p>
        </div>
      </div>
    </div>
  </header>
</template>
