<script setup lang="ts">
import { ref } from "vue";

import { BaseButton } from "@/components/atomic";

import type { DashboardPersonalization } from "./dashboardPersonalization";

defineProps<{
  personalization: DashboardPersonalization;
  error: string | null;
}>();

const emit = defineEmits<{
  create: [name: string];
  delete: [];
  export: [receiver: { value: string }];
  import: [serialized: string];
  reset: [];
  select: [presetId: string];
}>();

const name = ref("");

function download() {
  const receiver = { value: "" };
  emit("export", receiver);
  const url = URL.createObjectURL(new Blob([receiver.value], { type: "application/json" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "dashboard-personalization.json";
  anchor.click();
  URL.revokeObjectURL(url);
}

function onImportFile(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file) void file.text().then((text) => emit("import", text));
  input.value = "";
}

function createPreset() {
  emit("create", name.value);
  name.value = "";
}
</script>

<template>
  <section class="dashboard-personalization" aria-label="Dashboard personalization">
    <div class="dashboard-personalization__identity">
      <strong>My dashboard presets</strong>
      <span>User: {{ personalization.userId }}</span>
    </div>
    <label>
      Active preset
      <select
        :value="personalization.activePresetId"
        @change="emit('select', ($event.target as HTMLSelectElement).value)"
      >
        <option v-for="preset in personalization.presets" :key="preset.id" :value="preset.id">{{ preset.name }}</option>
      </select>
    </label>
    <div class="dashboard-personalization__create">
      <input v-model="name" aria-label="New preset name" placeholder="New preset name" />
      <BaseButton size="sm" variant="outline" @click="createPreset">Duplicate preset</BaseButton>
    </div>
    <BaseButton size="sm" variant="outline" @click="emit('reset')">Reset to default</BaseButton>
    <BaseButton
      size="sm"
      variant="outline"
      :disabled="personalization.presets.length <= 1"
      @click="emit('delete')"
    >
      Delete preset
    </BaseButton>
    <BaseButton size="sm" variant="outline" @click="download">Export personalization</BaseButton>
    <label class="dashboard-import-button">
      Import personalization
      <input accept="application/json" type="file" @change="onImportFile" />
    </label>
    <span v-if="error" class="dashboard-personalization__error" role="alert">{{ error }}</span>
  </section>
</template>
