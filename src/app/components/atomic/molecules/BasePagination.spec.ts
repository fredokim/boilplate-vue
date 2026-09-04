import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import BasePagination from "./BasePagination.vue";

describe("BasePagination", () => {
  it("updates the page model when a page button is clicked", async () => {
    const wrapper = mount(BasePagination, {
      props: {
        page: 1,
        pageSize: 10,
        total: 30,
        "onUpdate:page": (value: number) => wrapper.setProps({ page: value }),
      },
    });

    await wrapper.get("button:nth-of-type(3)").trigger("click");

    expect(wrapper.props("page")).toBe(2);
  });
});

