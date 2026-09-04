import type { RouteRecordRaw } from "vue-router";

export const visualGraphRoutes: RouteRecordRaw[] = [
  {
    path: "",
    name: "visual-graph-viewer",
    component: () => import("@/modules/visual-graph/containers/GraphViewerContainer.vue"),
    meta: { layout: "default", title: "Topology Explorer" },
  },
];
