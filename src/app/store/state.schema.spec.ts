import { describe, expect, it } from "vitest";

import type { InferDto } from "@core/dto/infer-dto";
import { parseState } from "@core/state/validate-state";
import type { AuthUserDto } from "@modules/auth/dto/Auth.dto";
import { UserRole } from "@modules/user/dto/User.dto";
import { userStateSchema } from "@modules/user/store/user.schema";
import { authUserStateSchema } from "./auth.schema";
import { uiStateSnapshotSchema } from "./ui.schema";

describe("store state schemas", () => {
  it("parses auth user state typed from auth DTO contract", () => {
    const user: InferDto<typeof AuthUserDto> = parseState(
      authUserStateSchema,
      {
        id: "demo-admin",
        name: "Demo Admin",
        email: "admin@example.com",
        roles: ["admin", "users:read"],
      },
      "auth.user.test",
    );

    expect(user.email).toBe("admin@example.com");
  });

  it("rejects invalid UI state snapshots", () => {
    expect(() =>
      parseState(
        uiStateSnapshotSchema,
        {
          sidebarOpen: "yes",
          pageTitle: "Dashboard",
          breadcrumbs: [],
          globalLoadingCount: 0,
        },
        "ui.snapshot.test",
      ),
    ).toThrow();
  });

  it("rejects invalid user role state", () => {
    expect(() =>
      parseState(
        userStateSchema,
        {
          id: "user-demo",
          name: "DashStack Admin",
          email: "admin@example.com",
          roles: ["super-admin"],
        },
        "user.state.test",
      ),
    ).toThrow();

    const validUser = parseState(
      userStateSchema,
      {
        id: "user-demo",
        name: "DashStack Admin",
        email: "admin@example.com",
        roles: [UserRole.Admin],
      },
      "user.state.valid",
    );

    expect(validUser.roles).toContain(UserRole.Admin);
  });
});
