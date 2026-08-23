import { computed } from "vue";
import type { RouteRecordRaw } from "vue-router";

import type { AtomicOption } from "@/components/atomic/types";

interface UseRouteMenuOptions {
  routes: RouteRecordRaw[];
  canAccess?: (permission: string) => boolean;
}

export function useRouteMenu({ canAccess, routes }: UseRouteMenuOptions) {
  const menuItems = computed<AtomicOption[]>(() =>
    routes
      .flatMap((route) => route.children ?? [])
      .filter((route) => route.meta?.title && route.path !== "/login")
      .filter((route) => {
        const permission = route.meta?.permission;

        return typeof permission === "string" ? canAccess?.(permission) ?? true : true;
      })
      .map((route) => ({
        label: String(route.meta?.title ?? route.name ?? route.path),
        value: route.path.startsWith("/") ? route.path : `/${route.path}`,
      }))
  );

  return {
    menuItems,
  };
}

