import { ref } from "vue";

import { initialPlayerState, type PlayerError, type PlayerPlaybackState, type PlayerState } from "../model/player";

/** A live manifest reports Infinity, which must not reach the UI as a duration. */
function readDuration(video: HTMLVideoElement) {
  return Number.isFinite(video.duration) ? video.duration : 0;
}

function readSeekable(video: HTMLVideoElement) {
  // A detached element reports no seekable range at all, so treat a missing one as empty
  // rather than letting a timeupdate during teardown throw.
  const seekable = video.seekable as TimeRanges | undefined;
  if (!seekable || seekable.length === 0) return { seekableStart: 0, seekableEnd: 0 };
  return { seekableStart: seekable.start(0), seekableEnd: seekable.end(seekable.length - 1) };
}

export function useVideoPlayerState() {
  const playerState = ref<PlayerState>({ ...initialPlayerState });

  const setPlaybackState = (playbackState: PlayerPlaybackState) => {
    playerState.value = { ...playerState.value, playbackState };
  };

  const setError = (error: PlayerError | null) => {
    playerState.value = {
      ...playerState.value,
      error,
      playbackState: error ? "error" : playerState.value.playbackState,
    };
  };

  const updateTiming = (video: HTMLVideoElement) => {
    playerState.value = {
      ...playerState.value,
      currentTime: video.currentTime,
      duration: readDuration(video),
      // A stream with no finite duration is live; DVR then shows up as a seekable window.
      isLive: video.duration === Number.POSITIVE_INFINITY,
      ...readSeekable(video),
    };
  };

  const reset = () => {
    playerState.value = { ...initialPlayerState };
  };

  return { playerState, setPlaybackState, setError, updateTiming, reset };
}
