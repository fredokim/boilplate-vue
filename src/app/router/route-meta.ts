import "vue-router";

export type AppLayoutName = "default" | "blank";

declare module "vue-router" {
  interface RouteMeta {
    layout?: AppLayoutName;
    title?: string;
    auth?: boolean;
    permission?: string;
  }
}
