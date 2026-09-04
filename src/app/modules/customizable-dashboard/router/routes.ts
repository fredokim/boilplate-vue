import type { RouteRecordRaw } from "vue-router";

/**
 * The name must differ from the module directory name. The router builds a
 * parent group named after the directory and mounts these as its children, and
 * vue-router refuses a child that shares a name with its ancestor — by throwing
 * during route registration, which leaves the whole application blank.
 */
export const customizableDashboardRoutes: RouteRecordRaw[] = [
  {
    path: "",
    name: "customizable-dashboard-home",
    component: () => import("@/modules/customizable-dashboard/containers/CustomizableDashboardContainer.vue"),
    meta: { layout: "default", title: "Customizable Dashboard" },
  },
];
