import "reflect-metadata";
import { createApp } from "vue";
import { router } from "@/router/index";
import { initWebVitals } from "@core/analytics";
import { pinia } from "@store/index";
import { initTheme } from "@core/theme";
import { EventBusKey } from "@core/service/event-bus.key";
import { appEventBus } from "@core/service/event-bus.service";

import App from "./App.vue";
import "./app/styles/tailwind.css";
import "./assets/main.scss";

initTheme();
initWebVitals();

const app = createApp(App);

app.provide(EventBusKey, appEventBus);
app.use(pinia);
app.use(router);
app.mount("#app");
