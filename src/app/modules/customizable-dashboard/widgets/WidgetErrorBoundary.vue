<script setup lang="ts">
import { onErrorCaptured, ref } from "vue";

const hasError = ref(false);

onErrorCaptured(() => {
  // The boundary is the integration point for a future production error reporter.
  hasError.value = true;
  return false;
});
</script>

<template>
  <div v-if="hasError" class="widget-runtime-error" role="alert">This widget could not be displayed.</div>
  <slot v-else />
</template>
