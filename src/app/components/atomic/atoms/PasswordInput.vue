<script setup lang="ts">
import { computed, ref } from "vue";

import BaseInput from "./BaseInput.vue";
import type { AtomicRadius, AtomicSize, AtomicState } from "../types";

const model = defineModel<string | null>();
const visible = ref(false);
const inputType = computed(() => (visible.value ? "text" : "password"));

withDefaults(
  defineProps<{
    id?: string;
    name?: string;
    placeholder?: string;
    autocomplete?: string;
    size?: AtomicSize;
    radius?: AtomicRadius;
    state?: AtomicState;
    disabled?: boolean;
    readonly?: boolean;
    required?: boolean;
    ariaLabel?: string;
    ariaDescribedby?: string;
  }>(),
  {
    autocomplete: "current-password",
    size: "md",
    radius: "md",
    state: "idle",
    disabled: false,
    readonly: false,
    required: false,
  }
);
</script>

<template>
  <div class="relative flex items-center">
    <BaseInput
      v-model="model"
      class="pr-16"
      :type="inputType"
      :id="id"
      :name="name"
      :placeholder="placeholder"
      :autocomplete="autocomplete"
      :size="size"
      :radius="radius"
      :state="state"
      :disabled="disabled"
      :readonly="readonly"
      :required="required"
      :aria-label="ariaLabel"
      :aria-describedby="ariaDescribedby"
    />
    <button
      class="absolute right-1.5 rounded px-2 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30"
      type="button"
      :disabled="disabled"
      :aria-pressed="visible"
      @click="visible = !visible"
    >
      {{ visible ? "Hide" : "Show" }}
    </button>
  </div>
</template>
