import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it } from "vitest";

import { useAuthStore } from "./auth.store";

describe("auth store", () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
  });

  it("stores and clears a demo JWT session", () => {
    const auth = useAuthStore();

    auth.useDemoSession();

    expect(auth.isAuthenticated).toBe(true);
    expect(auth.accessToken).toBe("demo-access-token");
    expect(auth.hasPermission("users:read")).toBe(true);
    expect(localStorage.getItem("boilerplate.accessToken")).toBe(
      "demo-access-token"
    );

    auth.clearSession();

    expect(auth.isAuthenticated).toBe(false);
    expect(localStorage.getItem("boilerplate.accessToken")).toBeNull();
  });
});
