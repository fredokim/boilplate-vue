<script setup lang="ts">
import BaseButton from "../atoms/BaseButton.vue";

withDefaults(
  defineProps<{
    submitLabel?: string;
    cancelLabel?: string;
    submitting?: boolean;
    disabled?: boolean;
    showCancel?: boolean;
  }>(),
  {
    cancelLabel: "Cancel",
    showCancel: true,
    submitLabel: "Save",
  }
);

defineEmits<{
  cancel: [];
}>();
</script>

<template>
  <div class="flex flex-wrap justify-end gap-2">
    <BaseButton
      v-if="showCancel"
      type="button"
      variant="outline"
      tone="neutral"
      :disabled="submitting"
      @click="$emit('cancel')"
    >
      {{ cancelLabel }}
    </BaseButton>
    <BaseButton type="submit" :disabled="disabled || submitting">
      {{ submitting ? "Saving" : submitLabel }}
    </BaseButton>
  </div>
</template>

