<script setup lang="ts">
import AlertSnackbar from "@/components/global/AlertSnackbar.vue";
import ConfirmDialog from "@/components/global/ConfirmDialog.vue";
import CustomDialog from "@/components/global/CustomDialog.vue";
</script>

<template>
  <router-view />
  <alert-snackbar />
  <confirm-dialog />
  <custom-dialog />
</template>
