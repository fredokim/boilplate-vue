<script lang="ts" setup>
import { onBeforeUnmount, ref } from "vue";

import { useEventBus } from "@core/composables/useNotification";

const bus = useEventBus();
const visible = ref(false);
const title = ref("Confirm");
const message = ref("");
const confirmText = ref("Confirm");
const cancelText = ref("Cancel");
let onConfirmCb = () => {};
let onCancelCb = () => {
  visible.value = false;
};

const unsubscribe = bus.on("confirm", (payload) => {
  title.value = payload.title ?? "Confirm";
  message.value = payload.message;
  confirmText.value = payload.confirmText ?? "Confirm";
  cancelText.value = payload.cancelText ?? "Cancel";
  onConfirmCb = () => {
    payload.onConfirm();
    visible.value = false;
  };
  onCancelCb = () => {
    payload.onCancel?.();
    visible.value = false;
  };
  visible.value = true;
});

onBeforeUnmount(unsubscribe);

function confirm() {
  onConfirmCb();
}

function cancel() {
  onCancelCb();
}
</script>

<template>
  <transition name="fade">
    <div v-if="visible" class="modal-overlay" @click="cancel"></div>
  </transition>
  <transition name="scale-fade">
    <div v-if="visible" class="modal-panel-wrapper">
      <div class="modal-panel" @click.stop>
        <h3 class="modal-title">{{ title }}</h3>
        <p class="modal-message">{{ message }}</p>
        <div class="modal-buttons">
          <button class="btn btn-cancel" @click="cancel">
            {{ cancelText }}
          </button>
          <button class="btn btn-confirm" @click="confirm">
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>
