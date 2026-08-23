import type { RouteRecordRaw } from "vue-router";

export const customizableDashboardRoutes: RouteRecordRaw[] = [
  {
    path: "",
    name: "customizable-dashboard",
    component: () => import("@/modules/customizable-dashboard/containers/CustomizableDashboardContainer.vue"),
    meta: { layout: "default", title: "Customizable Dashboard" },
  },
];
