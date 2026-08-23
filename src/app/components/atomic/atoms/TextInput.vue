<script setup lang="ts">
import BaseInput from "./BaseInput.vue";
import type { AtomicRadius, AtomicSize, AtomicState } from "../types";

const model = defineModel<string | null>();

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
  <BaseInput
    v-model="model"
    type="text"
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
</template>
