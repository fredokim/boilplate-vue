<script setup lang="ts">
import { computed } from "vue";

import BaseButton from "@/components/atomic/atoms/BaseButton.vue";
import { themeMode } from "@core/composables/useTheme";
import { getThemeColors } from "@core/theme/themeColors";
import type { ThemeColor } from "@core/theme/themeColors";

const themeColors = computed<ThemeColor[]>(() =>
  getThemeColors(themeMode.value)
);
</script>

<template>
  <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
    <div
      v-for="color in themeColors"
      :key="color.name"
      class="flex flex-col items-center rounded-lg border border-slate-200 bg-white p-4"
    >
      <div
        class="h-16 w-16 rounded-full border border-slate-200"
        :style="{ backgroundColor: `var(${color.variable})` }"
      />
      <div class="mt-2 text-center text-sm">
        <div class="font-semibold text-slate-900">{{ color.name }}</div>
        <div class="text-xs text-slate-500">{{ color.hex }}</div>
        <div class="text-xs text-slate-400">{{ color.variable }}</div>
      </div>
      <BaseButton class="mt-3" size="sm">Button</BaseButton>
    </div>
  </div>
</template>
