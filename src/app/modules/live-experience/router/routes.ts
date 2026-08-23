import type { RouteRecordRaw } from "vue-router";

export const liveExperienceRoutes: RouteRecordRaw[] = [
  {
    path: "",
    name: "live-experience",
    component: () => import("@/modules/live-experience/containers/LiveExperienceContainer.vue"),
    meta: { layout: "default", title: "Live Lab" },
  },
];
