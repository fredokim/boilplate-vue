<script setup lang="ts">
import RealtimeChat from "../chat/components/RealtimeChat.vue";
import VideoPlayer from "../player/components/VideoPlayer.vue";
import type { ChatMessage } from "../chat/model/chatMessage";
import type { ChatConnectionState, ChatDiagnostics } from "../chat/realtime/types";
import type { VideoSource } from "../player/model/player";
import "./liveExperience.scss";

defineProps<{
  chatMessages: readonly ChatMessage[];
  chatDiagnostics: ChatDiagnostics;
  connectionState: ChatConnectionState;
  videoSource: VideoSource;
}>();
</script>

<template>
  <div class="grid gap-5">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="m-0 text-2xl font-black text-slate-900">Live Streaming Lab</h1>
        <p class="mt-2 text-sm text-slate-600">A baseline for measuring streaming and realtime rendering behavior.</p>
      </div>
    </div>
    <div class="live-experience">
      <VideoPlayer :source="videoSource" title="Summer Stage · Live rehearsal" />
      <RealtimeChat :connection-state="connectionState" :diagnostics="chatDiagnostics" :messages="chatMessages" />
    </div>
  </div>
</template>
