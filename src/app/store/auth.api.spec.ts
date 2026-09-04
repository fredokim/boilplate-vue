import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it } from "vitest";

import { useAuthStore } from "./auth.store";

describe("auth API store integration", () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
  });

  it("checks session through the MSW auth contract", async () => {
    localStorage.setItem("boilerplate.accessToken", "existing-token");
    const auth = useAuthStore();

    const success = await auth.checkSession();

    expect(success).toBe(true);
    expect(auth.user?.email).toBe("mock@example.com");
    expect(auth.isAuthenticated).toBe(true);
  });
});

