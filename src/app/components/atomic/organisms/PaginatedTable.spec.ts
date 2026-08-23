import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import PaginatedTable from "./PaginatedTable.vue";

const columns = [
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
];

const rows = Array.from({ length: 12 }, (_, index) => ({
  id: String(index + 1),
  name: `User ${index + 1}`,
  email: `user${index + 1}@example.com`,
}));

describe("PaginatedTable", () => {
  it("renders only the current page rows", () => {
    const wrapper = mount(PaginatedTable, {
      props: {
        columns,
        page: 2,
        pageSize: 5,
        rowKey: "id",
        rows,
      },
    });

    expect(wrapper.text()).toContain("User 6");
    expect(wrapper.text()).toContain("User 10");
    expect(wrapper.text()).not.toContain("user1@example.com");
  });
});
