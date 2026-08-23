import { onScopeDispose, ref, shallowRef } from "vue";

import type { ChatMessage } from "../model/chatMessage";
import type { RealtimeChatAdapter, RealtimeConnectionState } from "../realtime/realtimeChatAdapter";

export function useRealtimeChat(adapter: RealtimeChatAdapter) {
  const messages = shallowRef<ChatMessage[]>([]);
  const connectionState = ref<RealtimeConnectionState>("idle");

  const disconnect = adapter.connect({
    onMessage: (message) => {
      messages.value = [...messages.value, message];
    },
    onStateChange: (state) => {
      connectionState.value = state;
    },
  });

  onScopeDispose(disconnect);

  return { connectionState, messages };
}
