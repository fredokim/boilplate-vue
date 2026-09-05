import { afterEach, describe, expect, it, vi } from "vitest";

import { TypedApiError } from "@core/api/api-error";
import { describeFailure, failureKeyOf, failureStatus, type FailureKey } from "./failureStatus";

const ALL: FailureKey[] = [
  "offline",
  "unreachable",
  "timeout",
  "unauthorized",
  "forbidden",
  "not-found",
  "server",
  "contract",
  "unknown",
];

function withOnline(online: boolean) {
  const spy = vi.spyOn(navigator, "onLine", "get").mockReturnValue(online);
  return () => spy.mockRestore();
}

describe("failureStatus", () => {
  afterEach(() => vi.restoreAllMocks());

  it("has a sentence for every key", () => {
    for (const key of ALL) {
      const status = failureStatus(key);
      expect(status.title).toBeTruthy();
      expect(status.detail).toBeTruthy();
      expect(["warning", "error"]).toContain(status.tone);
    }
  });

  it("does not offer a retry that cannot work", () => {
    expect(failureStatus("forbidden").retryable).toBe(false);
    expect(failureStatus("not-found").retryable).toBe(false);
    expect(failureStatus("contract").retryable).toBe(false);
  });

  it("offers a retry where waiting plausibly helps", () => {
    expect(failureStatus("offline").retryable).toBe(true);
    expect(failureStatus("unreachable").retryable).toBe(true);
    expect(failureStatus("server").retryable).toBe(true);
  });
});

describe("failureKeyOf", () => {
  afterEach(() => vi.restoreAllMocks());

  it("calls a network failure offline only when the device is offline", () => {
    const error = new TypedApiError("frontend", "network", "no route");

    const restore = withOnline(false);
    expect(failureKeyOf(error)).toBe("offline");
    restore();

    const restoreOnline = withOnline(true);
    expect(failureKeyOf(error)).toBe("unreachable");
    restoreOnline();
  });

  /**
   * The kinds here name the layer, not the problem: one `http_status` covers
   * 401, 404 and 503. Without the status code every one of them would read the
   * same, which is the thing this vocabulary exists to stop.
   */
  it("reads the status because the kind does not distinguish", () => {
    const at = (status: number) => new TypedApiError("backend", "http_status", "failed", { status });

    expect(failureKeyOf(at(401))).toBe("unauthorized");
    expect(failureKeyOf(at(403))).toBe("forbidden");
    expect(failureKeyOf(at(404))).toBe("not-found");
    expect(failureKeyOf(at(503))).toBe("server");
  });

  it("treats the backend's one auth code as sign-in-required", () => {
    const error = new TypedApiError("backend", "business_status", "nope", { code: "AUTH_REQUIRED" });

    expect(failureKeyOf(error)).toBe("unauthorized");
  });

  it("reads a contract mismatch as the server surprising us, not the reader erring", () => {
    expect(failureKeyOf(new TypedApiError("frontend", "response_contract", "bad shape"))).toBe("contract");
    expect(failureStatus("contract").detail).not.toMatch(/you|your/i);
  });
});

describe("describeFailure", () => {
  it("accepts whatever was thrown", () => {
    expect(describeFailure(new TypedApiError("backend", "http_status", "boom", { status: 500 })).title).toBe(
      "Server error",
    );
    expect(describeFailure(new Error("plain")).title).toBe("Something went wrong");
    expect(describeFailure("a string").title).toBeTruthy();
  });
});
