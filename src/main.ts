import "reflect-metadata";
import { createApp } from "vue";
import { router } from "@/router/index";
import { initWebVitals } from "@core/analytics";
import { pinia } from "@store/index";
import { initTheme } from "@core/theme";
import { EventBusKey } from "@core/service/event-bus.key";
/**
 * Imported for its side effect: the module refuses a production build running
 * on demo data, and rejects a misspelled VITE_DATA_MODE. Evaluating it here
 * means that happens at startup. Reached only through a lazily loaded view, the
 * guard would let a bad build boot and fail later, on whichever screen happened
 * to import it first.
 */
import "@core/config/dataMode";
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
