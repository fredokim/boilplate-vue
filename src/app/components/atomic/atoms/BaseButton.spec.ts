import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import BaseButton from "./BaseButton.vue";

describe("BaseButton", () => {
  it("renders slot content and defaults to button type", () => {
    const wrapper = mount(BaseButton, {
      slots: {
        default: "Save",
      },
    });

    expect(wrapper.text()).toContain("Save");
    expect(wrapper.attributes("type")).toBe("button");
  });

  it("applies disabled state", () => {
    const wrapper = mount(BaseButton, {
      props: {
        disabled: true,
      },
    });

    expect(wrapper.attributes("disabled")).toBeDefined();
  });
});

