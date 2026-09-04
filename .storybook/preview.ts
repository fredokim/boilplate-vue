import type { Preview } from "@storybook/vue3";

import "../src/app/styles/tailwind.css";
import "../src/assets/main.scss";

document.documentElement.dataset.theme = "light";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: "centered",
  },
  decorators: [
    () => ({
      template:
        '<div style="min-width: 360px; max-width: 960px; padding: 24px;"><story /></div>',
    }),
  ],
};

export default preview;
