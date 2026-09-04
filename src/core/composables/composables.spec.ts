import { effectScope, nextTick } from "vue";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useBreakpoint } from "./useBreakpoint";
import { useWebViewBridge } from "./useWebViewBridge";

function setViewportWidth(width: number) {
  Object.defineProperty(window, "innerWidth", { configurable: true, value: width, writable: true });
}

describe("useBreakpoint", () => {
  afterEach(() => setViewportWidth(1024));

  it("classifies the current viewport", () => {
    const scope = effectScope();

    setViewportWidth(500);
    expect(scope.run(() => useBreakpoint())?.value).toBe("mobile");
    setViewportWidth(800);
    expect(scope.run(() => useBreakpoint())?.value).toBe("tablet");
    setViewportWidth(1400);
    expect(scope.run(() => useBreakpoint())?.value).toBe("desktop");

    scope.stop();
  });

  it("updates on resize and stops listening once the scope is disposed", async () => {
    const scope = effectScope();
    setViewportWidth(1400);
    const breakpoint = scope.run(() => useBreakpoint());
    expect(breakpoint?.value).toBe("desktop");

    setViewportWidth(500);
    window.dispatchEvent(new Event("resize"));
    await nextTick();
    expect(breakpoint?.value).toBe("mobile");

    scope.stop();
    setViewportWidth(1400);
    window.dispatchEvent(new Event("resize"));
    await nextTick();
    expect(breakpoint?.value).toBe("mobile");
  });
});

describe("useWebViewBridge", () => {
  afterEach(() => {
    delete window.ReactNativeWebView;
  });

  it("reports a plain browser when no bridge is present", () => {
    const scope = effectScope();
    expect(scope.run(() => useWebViewBridge())?.isWebView.value).toBe(false);
    scope.stop();
  });

  it("detects the bridge and forwards serialized messages", () => {
    const postMessage = vi.fn();
    window.ReactNativeWebView = { postMessage };

    const scope = effectScope();
    const bridge = scope.run(() => useWebViewBridge());
    expect(bridge?.isWebView.value).toBe(true);

    bridge?.postMessage({ type: "ready", payload: { screen: "dashboard" } });
    expect(postMessage).toHaveBeenCalledWith(JSON.stringify({ type: "ready", payload: { screen: "dashboard" } }));

    scope.stop();
  });
});
