import { ref } from "vue";

import type { PlayerPlaybackState, PlayerState } from "../model/player";

const initialState: PlayerState = {
  playbackState: "idle",
  currentTime: 0,
  duration: 0,
};

export function useVideoPlayerState() {
  const playerState = ref<PlayerState>({ ...initialState });

  const setPlaybackState = (playbackState: PlayerPlaybackState) => {
    playerState.value = { ...playerState.value, playbackState };
  };

  const updateTiming = (video: HTMLVideoElement) => {
    playerState.value = {
      ...playerState.value,
      currentTime: video.currentTime,
      duration: Number.isFinite(video.duration) ? video.duration : 0,
    };
  };

  return { playerState, setPlaybackState, updateTiming };
}
