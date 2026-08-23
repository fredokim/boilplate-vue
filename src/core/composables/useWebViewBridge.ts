import { computed } from "vue";

type WebViewPayload = Record<string, string | number | boolean | null>;

type WebViewMessage = {
  type: string;
  payload?: WebViewPayload;
};

declare global {
  interface Window {
    ReactNativeWebView?: {
      postMessage: (message: string) => void;
    };
  }
}

export function useWebViewBridge() {
  const isWebView = computed(() => Boolean(window.ReactNativeWebView));

  const postMessage = (message: WebViewMessage) => {
    window.ReactNativeWebView?.postMessage(JSON.stringify(message));
  };

  return { isWebView, postMessage };
}
