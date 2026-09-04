import { http, HttpResponse } from "msw";


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
    // The session endpoint returns the user and nothing else. No access token,
    // and never a refresh token — that one only ever exists as an HttpOnly
    // cookie. A mock that hands out more than the server does lets code depend
    // on fields that will not be there.
    success: http.get("/api/auth/session", () =>
      HttpResponse.json({
        success: true,
        data: {
          user: {
            id: "mock-user",
            name: "Mock User",
            email: "mock@example.com",
            permissions: ["dashboard:read", "user:read"],
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
        success: true,
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
        success: true,
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
