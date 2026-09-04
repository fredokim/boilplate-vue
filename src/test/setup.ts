import "reflect-metadata";

import { afterAll, afterEach, beforeAll, expect } from "vitest";
import * as matchers from "vitest-axe/matchers";

import { server } from "./msw/server";

expect.extend(matchers);

Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
  value: () => null,
});

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
