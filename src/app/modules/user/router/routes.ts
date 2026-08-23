import type { RouteRecordRaw } from "vue-router";

export const userRoutes: RouteRecordRaw[] = [
  {
    path: "",
    name: "user-contract-sample",
    component: () => import("../views/UserContractView.vue"),
    meta: {
      auth: true,
      layout: "default",
      permission: "users:read",
      title: "User Contract Sample",
    },
  },
];

