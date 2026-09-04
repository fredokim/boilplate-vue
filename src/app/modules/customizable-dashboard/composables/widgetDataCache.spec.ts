import { describe, expect, it, vi } from "vitest";

import type { DashboardData } from "../data/dashboardDataSource";
import { WidgetDataCache } from "./widgetDataCache";

const kpi: DashboardData = { kind: "kpi", label: "Revenue", value: 100 };

describe("WidgetDataCache", () => {
  it("issues one request when two callers share a key", async () => {
    const cache = new WidgetDataCache();
    const loader = vi.fn(() => Promise.resolve(kpi));

    await Promise.all([cache.fetch("k", loader), cache.fetch("k", loader)]);

    expect(loader).toHaveBeenCalledTimes(1);
    expect(cache.size()).toBe(1);
  });

  it("serves a fresh result from cache within the stale time", async () => {
    const cache = new WidgetDataCache();
    const loader = vi.fn(() => Promise.resolve(kpi));

    await cache.fetch("k", loader, 60_000);
    await cache.fetch("k", loader, 60_000);

    expect(loader).toHaveBeenCalledTimes(1);
  });

  it("refetches once the entry is invalidated", async () => {
    const cache = new WidgetDataCache();
    const loader = vi.fn(() => Promise.resolve(kpi));

    await cache.fetch("k", loader, 60_000);
    cache.invalidate("k");
    await cache.fetch("k", loader, 60_000);

    expect(loader).toHaveBeenCalledTimes(2);
  });

  it("keeps separate keys separate", async () => {
    const cache = new WidgetDataCache();
    const loader = vi.fn(() => Promise.resolve(kpi));

    await cache.fetch("a", loader);
    await cache.fetch("b", loader);

    expect(loader).toHaveBeenCalledTimes(2);
    expect(cache.size()).toBe(2);
  });

  it("records the error and reports it to readers", async () => {
    const cache = new WidgetDataCache();
    const failure = new Error("nope");

    await expect(cache.fetch("k", () => Promise.reject(failure))).rejects.toThrow("nope");

    expect(cache.read("k").error).toBe(failure);
    expect(cache.read("k").isPending).toBe(false);
  });

  it("notifies subscribers when a fetch settles", async () => {
    const cache = new WidgetDataCache();
    const listener = vi.fn();
    cache.subscribe("k", listener);

    await cache.fetch("k", () => Promise.resolve(kpi));

    expect(listener).toHaveBeenCalled();
  });
})
