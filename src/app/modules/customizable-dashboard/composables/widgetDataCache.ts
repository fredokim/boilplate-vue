import type { DashboardData } from "../data/dashboardDataSource";

type CacheEntry = {
  data?: DashboardData;
  error?: Error;
  fetchedAt: number;
  inFlight?: Promise<DashboardData>;
  subscribers: Set<() => void>;
};

/**
 * A deliberately small query cache covering the three behaviours the dashboard widgets
 * rely on, and nothing else:
 *
 *  - two widgets sharing a query key issue one request
 *  - a result younger than staleTimeMs is served from cache
 *  - refresh is opt-in per widget rather than global
 *
 * The React boilerplate gets these from TanStack Query. @tanstack/vue-query is the
 * direct equivalent and works on Vue 3, but npm installs its optional Vue 2 compat
 * peer anyway and then fails on that package's own peer range. See the server-state
 * caching decision in docs/development/DEPENDENCY_STRATEGY.md for what this cache deliberately omits
 * and when to switch.
 */
export class WidgetDataCache {
  private readonly entries = new Map<string, CacheEntry>();

  private entry(key: string): CacheEntry {
    const existing = this.entries.get(key);
    if (existing) return existing;
    const created: CacheEntry = { fetchedAt: 0, subscribers: new Set() };
    this.entries.set(key, created);
    return created;
  }

  subscribe(key: string, listener: () => void) {
    const entry = this.entry(key);
    entry.subscribers.add(listener);
    return () => entry.subscribers.delete(listener);
  }

  read(key: string) {
    const entry = this.entries.get(key);
    return { data: entry?.data, error: entry?.error, isPending: !entry || (!entry.data && !entry.error) };
  }

  /** Returns the in-flight promise when one is already running for this key. */
  fetch(key: string, loader: () => Promise<DashboardData>, staleTimeMs = 0, now = Date.now()): Promise<DashboardData> {
    const entry = this.entry(key);
    if (entry.inFlight) return entry.inFlight;
    if (entry.data && now - entry.fetchedAt < staleTimeMs) return Promise.resolve(entry.data);

    const request = loader()
      .then((data) => {
        entry.data = data;
        delete entry.error;
        entry.fetchedAt = Date.now();
        return data;
      })
      .catch((reason: unknown) => {
        entry.error = reason instanceof Error ? reason : new Error(String(reason));
        throw entry.error;
      })
      .finally(() => {
        delete entry.inFlight;
        entry.subscribers.forEach((listener) => listener());
      });

    entry.inFlight = request;
    return request;
  }

  invalidate(key?: string) {
    if (key === undefined) {
      for (const entry of this.entries.values()) {
        entry.fetchedAt = 0;
        entry.subscribers.forEach((listener) => listener());
      }
      return;
    }
    const entry = this.entries.get(key);
    if (!entry) return;
    entry.fetchedAt = 0;
    entry.subscribers.forEach((listener) => listener());
  }

  size() {
    return this.entries.size;
  }

  clear() {
    this.entries.clear();
  }
}

export const widgetDataCache = new WidgetDataCache();
