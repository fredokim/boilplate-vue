<script setup lang="ts">
import { computed } from "vue";

import TextInput from "../atoms/TextInput.vue";
import FormField from "../molecules/FormField.vue";

const value = defineModel<string | null>();

const props = withDefaults(
  defineProps<{
    id: string;
    label: string;
    description?: string;
    required?: boolean;
    validator?: (value: string | null) => string | null;
  }>(),
  {
    required: false,
  }
);

const error = computed(() => props.validator?.(value.value ?? null) ?? null);
</script>

<template>
  <FormField
    :id="id"
    :label="label"
    :description="description"
    :required="required"
    :error="error ?? undefined"
  >
    <template #default="{ id: fieldId, describedby, state }">
      <TextInput
        v-model="value"
        :id="fieldId"
        :required="required"
        :aria-describedby="describedby"
        :state="state"
      />
    </template>
  </FormField>
</template>
