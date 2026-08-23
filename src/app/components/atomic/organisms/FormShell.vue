<script setup lang="ts">
import FormActions from "../molecules/FormActions.vue";

withDefaults(
  defineProps<{
    title: string;
    description?: string;
    submitLabel?: string;
    submitting?: boolean;
    disabled?: boolean;
  }>(),
  {
    submitLabel: "Save",
  }
);

defineEmits<{
  cancel: [];
  submit: [];
}>();
</script>

<template>
  <form class="grid gap-5" @submit.prevent="$emit('submit')">
    <header class="grid gap-1">
      <h2 class="m-0 text-lg font-semibold text-slate-950">{{ title }}</h2>
      <p v-if="description" class="m-0 text-sm text-slate-500">
        {{ description }}
      </p>
    </header>

    <div class="grid gap-4">
      <slot />
    </div>

    <FormActions
      :disabled="disabled"
      :submit-label="submitLabel"
      :submitting="submitting"
      @cancel="$emit('cancel')"
    />
  </form>
</template>

