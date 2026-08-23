<script setup lang="ts">
import type { LightweightWidget as LightweightWidgetModel } from "../model/dashboardWidget";

defineProps<{ widget: LightweightWidgetModel }>();
</script>

<template>
  <div>
    <p class="m-0 text-sm font-bold text-slate-900">{{ widget.config.title }}</p>
    <p class="mt-2 text-2xl font-black text-slate-900">{{ widget.config.value }}</p>
  </div>
</template>
