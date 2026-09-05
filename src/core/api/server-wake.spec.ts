import { afterEach, describe, expect, it, vi } from "vitest";
import { ServerWakeGate, ASLEEP_CODE } from "./server-wake";
import { TypedApiError } from "./api-error";
import { failureKeyOf, failureStatus } from "@core/result/failureStatus";

afterEach(() => vi.useRealTimers());

/**
 * These exist because of a real outage, not a hypothetical one. Opening a page
 * sent four requests at a sleeping free instance, the host answered the burst by
 * refusing to wake it, and everything stayed `429 Too Many Requests` for twelve
 * minutes. One patient request woke it immediately.
 */
describe("ServerWakeGate", () => {
  it("costs nothing until something reports the server asleep", async () => {
    const check = vi.fn(async () => true);
    const gate = new ServerWakeGate(check);

    await gate.wait();

    expect(gate.isWaking).toBe(false);
    expect(check).not.toHaveBeenCalled();
  });

  it("probes once however many callers find the server asleep", async () => {
    const check = vi.fn(async () => true);
    const gate = new ServerWakeGate(check, 0);

    gate.reportAsleep();
    gate.reportAsleep();
    gate.reportAsleep();
    await Promise.all([gate.wait(), gate.wait(), gate.wait()]);

    expect(check).toHaveBeenCalledTimes(1);
  });

  it("holds callers until the server answers", async () => {
    vi.useFakeTimers();
    let awake = false;
    const gate = new ServerWakeGate(async () => awake, 1_000);
    const order: string[] = [];

    gate.reportAsleep();
    void gate.wait().then(() => order.push("released"));

    await vi.advanceTimersByTimeAsync(3_000);
    expect(order).toEqual([]);

    awake = true;
    await vi.advanceTimersByTimeAsync(1_000);

    expect(order).toEqual(["released"]);
  });

  /** A server that is down rather than asleep must not queue requests forever. */
  it("gives up rather than waiting without end", async () => {
    vi.useFakeTimers();
    const check = vi.fn(async () => false);
    const gate = new ServerWakeGate(check, 1_000, 3);
    let released = false;

    gate.reportAsleep();
    void gate.wait().then(() => {
      released = true;
    });
    await vi.advanceTimersByTimeAsync(10_000);

    expect(check).toHaveBeenCalledTimes(3);
    expect(released).toBe(true);
    expect(gate.isWaking).toBe(false);
  });
});

describe("the failure vocabulary on a sleeping server", () => {
  /**
   * The host's refusal has no envelope. This app's own 429s -- the login
   * throttle and the chat rate limit -- are JSON like every other answer, which
   * is what tells the two apart, and the code is what carries the distinction
   * through to the reader.
   */
  it("says a sleeping server is starting rather than unknown", () => {
    const asleep = new TypedApiError("backend", "http_status", "Backend returned HTTP 429.", {
      status: 429,
      code: ASLEEP_CODE,
    });

    expect(failureKeyOf(asleep)).toBe("waking");
    expect(failureStatus("waking").tone).toBe("warning");
    expect(failureStatus("waking").retryable).toBe(true);
    expect(failureStatus("waking").detail).toMatch(/minute/i);
  });

  it("leaves an API rate limit alone", () => {
    const throttled = new TypedApiError("backend", "http_status", "Backend returned HTTP 429.", {
      status: 429,
      code: "TOO_MANY_ATTEMPTS",
    });

    expect(failureKeyOf(throttled)).not.toBe("waking");
  });
});
