import { createRouter, createWebHistory, RouterView } from "vue-router";
import type { RouteRecordRaw } from "vue-router";

import LayoutShell from "@/layouts/LayoutShell.vue";
import { analytics } from "@core/analytics";
import { useAuthStore } from "@store/auth.store";
import "./route-meta";

const modules = import.meta.glob<{ [exportName: string]: RouteRecordRaw[] }>(
  ["../modules/**/router/routes.ts"],
  { eager: true }
);

const moduleRouteGroups = Object.entries(modules).reduce<RouteRecordRaw[]>(
  (routeGroups, [filePath, moduleExports]) => {
    const match = filePath.match(/modules\/([^/]+)\/router\/routes\.ts$/);

    if (!match) {
      return routeGroups;
    }

    const moduleName = match[1];
    const moduleRoutes = Object.values(moduleExports).flat();

    routeGroups.push({
      path: `/${moduleName}`,
      name: moduleName,
      component: RouterView,
      children: moduleRoutes,
    });

    return routeGroups;
  },
  []
);

export const routes: RouteRecordRaw[] = [
  {
    path: "/",
    component: LayoutShell,
    children: [
      {
        path: "/login",
        name: "Login",
        component: () => import("@modules/auth/views/LoginViews.vue"),
        meta: { auth: false, layout: "blank", title: "Login" },
      },
      {
        path: "/dashboard",
        name: "Dashboard",
        component: () => import("@modules/dashboard/views/HomeComponent.vue"),
        meta: { auth: true, layout: "default", title: "Dashboard" },
      },
      ...moduleRouteGroups,
    ],
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});

let routeStartedAt = getNow();

router.beforeEach(async (to) => {
  routeStartedAt = getNow();
  const auth = useAuthStore();
  const requiresAuth = to.matched.some((route) => route.meta.auth === true);
  const guestOnly = to.matched.some((route) => route.meta.auth === false);
  const requiredPermission = to.matched
    .map((route) => route.meta.permission)
    .find((permission): permission is string => Boolean(permission));

  if (requiresAuth && !auth.isAuthenticated) {
    await auth.checkSession();
  }

  if (requiresAuth && !auth.isAuthenticated) {
    return {
      path: "/login",
      query: {
        redirect: to.fullPath,
      },
    };
  }

  if (guestOnly && auth.isAuthenticated) {
    return "/dashboard";
  }

  if (requiredPermission && !auth.hasPermission(requiredPermission)) {
    return "/dashboard";
  }

  return true;
});

router.afterEach((to, from) => {
  const title = typeof to.meta.title === "string" ? to.meta.title : undefined;

  analytics.trackPageView(to.fullPath, title);
  analytics.trackRouteChange({
    durationMs: getNow() - routeStartedAt,
    from: from.fullPath,
    title,
    to: to.fullPath,
  });
});

function getNow() {
  return typeof performance === "undefined" ? Date.now() : performance.now();
}
