<script lang="ts" setup>
import type { Component } from "vue";
import { onBeforeUnmount, ref } from "vue";

import { useEventBus } from "@core/composables/useNotification";

const bus = useEventBus();
const visible = ref(false);
const comp = ref<null | Component>(null);
const propsData = ref<Record<string, unknown>>({});

const unsubscribe = bus.on("dialog", (payload) => {
  comp.value = payload.component;
  propsData.value = payload.props ?? {};
  visible.value = true;
});

onBeforeUnmount(unsubscribe);

function close() {
  visible.value = false;
}
</script>

<template>
  <div v-if="visible" class="dialog-overlay">
    <component :is="comp" v-bind="propsData" @close="close" />
  </div>
</template>
