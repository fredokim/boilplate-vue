import { serverWakeGate } from "@core/api/server-wake";
import { computed, onScopeDispose, ref, shallowRef } from "vue";

import { watchForIdle } from "@core/realtime/idleSuspension";

import { ChatController } from "../realtime/chatController";
import { ChatStore, type ChatStoreOptions } from "../realtime/chatStore";
import type { ChatConnectionState, ChatTransport } from "../realtime/types";

type UseRealtimeChatOptions = {
  roomId: string;
  transport: ChatTransport;
  store?: ChatStoreOptions;
};

/**
 * The store speaks subscribe/getSnapshot, which React consumes through
 * useSyncExternalStore. Here each snapshot is pushed into a shallowRef: it is replaced
 * wholesale on every flush, so deep reactivity would proxy every message for nothing.
 */
export function useRealtimeChat({ roomId, store: storeOptions, transport }: UseRealtimeChatOptions) {
  const store = new ChatStore(storeOptions);
  const controller = new ChatController({
    roomId,
    transport,
    store,
    waitForServer: () => serverWakeGate.wait(),
  });

  const snapshot = shallowRef(store.getSnapshot());
  // The controller, not the transport. The transport reports only what its
  // socket did, so it can never say `suspended` (the controller decides that)
  // or `reconnecting` (which exists only between a drop and the next attempt).
  // Reading it here is what made an idle release show up as a failure.
  const connectionState = ref<ChatConnectionState>(controller.getConnectionState());

  const unsubscribeStore = store.subscribe(() => {
    snapshot.value = store.getSnapshot();
  });
  const unsubscribeConnection = controller.subscribeConnection((state) => {
    connectionState.value = state;
  });

  void controller.start();

  const onVisibility = () => controller.setHidden(document.hidden);
  document.addEventListener("visibilitychange", onVisibility);

  /**
   * Hands the socket back when nobody is watching. An open socket is continuous
   * traffic, so a forgotten tab keeps a free instance awake all night for the
   * same cost as one in use.
   *
   * `suspend()` and `resume()` rather than stop and start: stop already
   * disconnects and blocks the reconnect backoff, but lands on `disconnected`,
   * the state that means a fault. Suspending says which happened; resuming rejoins from the
   * last applied sequence, so a returning reader catches up rather than
   * reloading.
   */
  const stopIdleWatch = watchForIdle({
    onIdle: () => controller.suspend(),
    onResume: () => void controller.resume(),
  });

  onScopeDispose(() => {
    stopIdleWatch();
    document.removeEventListener("visibilitychange", onVisibility);
    unsubscribeConnection();
    unsubscribeStore();
    controller.stop();
  });

  return {
    connectionState,
    messages: computed(() => snapshot.value.messages),
    diagnostics: computed(() => snapshot.value.diagnostics),
  };
}
