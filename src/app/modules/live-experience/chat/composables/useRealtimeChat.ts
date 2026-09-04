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
  const controller = new ChatController({ roomId, transport, store });

  const snapshot = shallowRef(store.getSnapshot());
  const connectionState = ref<ChatConnectionState>(transport.getConnectionState());

  const unsubscribeStore = store.subscribe(() => {
    snapshot.value = store.getSnapshot();
  });
  const unsubscribeConnection = transport.subscribeConnection((state) => {
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
   * `stop()` and `start()` rather than a new pair of methods: stop already
   * disconnects and blocks the reconnect backoff, and start rejoins from the
   * last applied sequence, so a returning reader catches up rather than
   * reloading.
   */
  const stopIdleWatch = watchForIdle({
    onIdle: () => controller.stop(),
    onResume: () => void controller.start(),
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
