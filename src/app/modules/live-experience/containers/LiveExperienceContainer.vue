<script setup lang="ts">
import LiveExperienceView from "../views/LiveExperienceView.vue";
import { useRealtimeChat } from "../chat/composables/useRealtimeChat";
import { liveChatRoomId, liveChatTransport } from "../chat/realtime/liveChatRoom";
import type { ChatTransport } from "../chat/realtime/types";
import { progressiveDemoSource } from "../player/model/liveSources";
import type { VideoSource } from "../player/model/player";

const props = withDefaults(
  defineProps<{
    transport?: ChatTransport;
    roomId?: string;
    source?: VideoSource;
  }>(),
  { roomId: liveChatRoomId, source: () => progressiveDemoSource },
);

const { connectionState, diagnostics, messages } = useRealtimeChat({
  roomId: props.roomId,
  transport: props.transport ?? liveChatTransport,
});
</script>

<template>
  <LiveExperienceView
    :chat-diagnostics="diagnostics"
    :chat-messages="messages"
    :connection-state="connectionState"
    :video-source="source"
  />
</template>
