import { computed, onScopeDispose, ref, shallowRef } from "vue";

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

  onScopeDispose(() => {
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
