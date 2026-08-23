<script setup lang="ts">
import LiveExperienceView from "../views/LiveExperienceView.vue";
import { useRealtimeChat } from "../chat/composables/useRealtimeChat";
import { createMockRealtimeChatAdapter } from "../chat/realtime/mockRealtimeChatAdapter";
import type { RealtimeChatAdapter } from "../chat/realtime/realtimeChatAdapter";
import type { VideoSource } from "../player/model/player";

const props = withDefaults(
  defineProps<{
    adapter?: RealtimeChatAdapter;
  }>(),
  {}
);

const videoSource: VideoSource = {
  kind: "progressive",
  src: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
  mimeType: "video/mp4",
};

const { connectionState, messages } = useRealtimeChat(props.adapter ?? createMockRealtimeChatAdapter());
</script>

<template>
  <LiveExperienceView
    :chat-messages="messages"
    :connection-state="connectionState"
    :video-source="videoSource"
  />
</template>
