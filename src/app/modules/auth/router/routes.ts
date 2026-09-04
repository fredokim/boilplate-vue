import type { RouteRecordRaw } from "vue-router";

export const authRoutes: RouteRecordRaw[] = [
  {
    path: "callback/:provider",
    name: "auth-social-callback",
    component: () => import("../views/SocialCallbackView.vue"),
    meta: {
      auth: false,
      layout: "blank",
      title: "Social Login Callback",
    },
  },
];

