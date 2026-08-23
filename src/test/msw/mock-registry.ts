import { http, HttpResponse } from "msw";

import { ApiStatusEnum } from "@shared/enum/result.enum";

export type MockRegistryEntry = {
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  endpoint: string;
  success: ReturnType<typeof http.get>;
  empty?: ReturnType<typeof http.get>;
  invalid?: ReturnType<typeof http.get>;
  error?: ReturnType<typeof http.get>;
};

export const mockRegistry = [
  {
    method: "GET",
    endpoint: "/api/auth/session",
    success: http.get("/api/auth/session", () =>
      HttpResponse.json({
        status: ApiStatusEnum.SUCCESS,
        data: {
          accessToken: "mock-access-token",
          refreshToken: "mock-refresh-token",
          user: {
            id: "mock-user",
            name: "Mock User",
            email: "mock@example.com",
            roles: ["admin", "users:read"],
          },
        },
      }),
    ),
  },
  {
    method: "GET",
    endpoint: "/api/users/:id",
    success: http.get("/api/users/:id", ({ params }) =>
      HttpResponse.json({
        status: ApiStatusEnum.SUCCESS,
        data: {
          id: String(params.id),
          name: "Mock User",
          email: "mock@example.com",
          roles: ["admin"],
        },
      }),
    ),
    invalid: http.get("/api/users/:id", () =>
      HttpResponse.json({
        status: ApiStatusEnum.SUCCESS,
        data: {
          id: 1,
          name: null,
          email: "broken",
          roles: ["admin"],
        },
      }),
    ),
  },
] satisfies MockRegistryEntry[];

export const handlers = mockRegistry.map((entry) => entry.success);
