import type { RouteRecordRaw } from "vue-router";

export const componentRoutes: RouteRecordRaw[] = [
  {
    path: "alert",
    name: "component-alert",
    component: () => import("@/modules/component/views/BaseAlert.vue"),
    meta: { layout: "default", title: "Alert" },
  },
  {
    path: "dialog",
    name: "component-dialog",
    component: () => import("@/modules/component/views/BaseDialog.vue"),
    meta: { layout: "default", title: "Dialog" },
  },
  {
    path: "color",
    name: "component-color",
    component: () => import("@/modules/component/views/ColorPreview.vue"),
    meta: { layout: "default", title: "Color" },
  },
];
