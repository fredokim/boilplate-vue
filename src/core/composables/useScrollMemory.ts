import { onScopeDispose, watch } from "vue";
import { useRoute } from "vue-router";

const SCROLL_MEMORY_LIMIT = 50;
const scrollMap = new Map<string, number>();

/**
 * Restores the scroll offset a route was left at. Keyed on fullPath, so returning to
 * the same URL returns to the same place; the map is bounded so a long session does
 * not accumulate entries forever.
 */
export function useScrollMemory() {
  const route = useRoute();

  function remember(key: string) {
    scrollMap.set(key, window.scrollY);
    if (scrollMap.size > SCROLL_MEMORY_LIMIT) {
      const oldestKey = scrollMap.keys().next().value;
      if (oldestKey) scrollMap.delete(oldestKey);
    }
  }

  const stop = watch(
    () => route.fullPath,
    (fullPath, previousPath) => {
      if (previousPath) remember(previousPath);
      window.scrollTo({ top: scrollMap.get(fullPath) ?? 0 });
    },
    { immediate: true },
  );

  onScopeDispose(() => {
    remember(route.fullPath);
    stop();
  });
}
