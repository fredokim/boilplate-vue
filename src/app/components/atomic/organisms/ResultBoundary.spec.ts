import { mount } from "@vue/test-utils";
import { axe } from "vitest-axe";
import { describe, expect, it } from "vitest";

import ResultBoundary from "./ResultBoundary.vue";

describe("ResultBoundary", () => {
  it("renders typed API error state accessibly", async () => {
    const wrapper = mount(ResultBoundary, {
      props: {
        failure: {
          code: "backend:response_contract",
          kind: "response_contract",
          message: "Backend response does not match the frontend DTO contract.",
          origin: "backend",
        },
        status: "error",
      },
    });

    expect(wrapper.text()).toContain("Backend response does not match");
    expect(await axe(wrapper.element)).toHaveNoViolations();
  });

  it("renders success slot content", () => {
    const wrapper = mount(ResultBoundary, {
      props: {
        status: "success",
      },
      slots: {
        default: "Loaded content",
      },
    });

    expect(wrapper.text()).toContain("Loaded content");
  });
});

