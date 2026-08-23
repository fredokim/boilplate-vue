import { computed, onBeforeUnmount, ref } from "vue";
import type { Ref } from "vue";
import { useIntersectionObserver } from "@vueuse/core";

interface UseManagedInfiniteScrollOptions<TItem> {
  items: Ref<TItem[]>;
  hasMore: Ref<boolean>;
  isLoading: Ref<boolean>;
  loadMore: () => Promise<void> | void;
  maxItems?: number;
}

export function useManagedInfiniteScroll<TItem>({
  hasMore,
  isLoading,
  items,
  loadMore,
  maxItems = 250,
}: UseManagedInfiniteScrollOptions<TItem>) {
  const sentinel = ref<HTMLElement | null>(null);
  const retainedItems = computed(() => items.value.slice(-maxItems));

  const { stop } = useIntersectionObserver(
    sentinel,
    ([entry]) => {
      if (!entry?.isIntersecting || isLoading.value || !hasMore.value) {
        return;
      }

      void loadMore();
    },
    {
      rootMargin: "160px",
      threshold: 0,
    }
  );

  onBeforeUnmount(() => {
    stop();
  });

  return {
    retainedItems,
    sentinel,
    stop,
  };
}
