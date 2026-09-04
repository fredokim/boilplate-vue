import type { RouteRecordRaw } from "vue-router";

/**
 * The name must differ from the module directory name. The router builds a
 * parent group named after the directory and mounts these as its children, and
 * vue-router refuses a child that shares a name with its ancestor — by throwing
 * during route registration, which leaves the whole application blank.
 */
export const liveExperienceRoutes: RouteRecordRaw[] = [
  {
    path: "",
    name: "live-experience-home",
    component: () => import("@/modules/live-experience/containers/LiveExperienceContainer.vue"),
    meta: { layout: "default", title: "Live Lab" },
  },
];
