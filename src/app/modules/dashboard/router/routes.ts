import type { RouteRecordRaw } from "vue-router";

export const dashboardRoutes: RouteRecordRaw[] = [
  {
    path: "",
    name: "dashboard-home",
    component: () => import("@/modules/dashboard/views/HomeComponent.vue"),
    meta: { layout: "default", title: "Dashboard" },
  },
];
