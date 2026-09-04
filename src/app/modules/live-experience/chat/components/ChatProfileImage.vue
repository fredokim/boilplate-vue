<script setup lang="ts">
defineProps<{
  displayName: string;
  src: string;
}>();
</script>

<template>
  <img :alt="`${displayName}'s profile`" class="live-chat__profile" height="36" :src="src" width="36" />
</template>
