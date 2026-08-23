import { watch } from "vue";
import { useRoute } from "vue-router";

import { analytics } from "@core/analytics";

/**
 * Reports a page view for every resolved route. The router already gives a single
 * reactive location, so unlike the React version there is no path/query recombination.
 */
export function useRouteAnalytics() {
  const route = useRoute();

  watch(
    () => route.fullPath,
    (fullPath) => {
      analytics.trackPageView(fullPath, typeof route.meta.title === "string" ? route.meta.title : undefined);
    },
    { immediate: true },
  );
}
