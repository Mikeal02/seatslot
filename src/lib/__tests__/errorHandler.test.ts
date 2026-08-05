import { describe, it, expect, vi, afterEach } from "vitest";
import { logError, getErrorMessage } from "@/lib/errorHandler";

afterEach(() => vi.restoreAllMocks());

describe("getErrorMessage", () => {
  it("reads Error.message", () => {
    expect(getErrorMessage(new Error("boom"))).toBe("boom");
  });

  it("passes strings through", () => {
    expect(getErrorMessage("nope")).toBe("nope");
  });

  it("falls back for unknown shapes", () => {
    expect(getErrorMessage({ weird: true })).toBe("An unexpected error occurred");
  });
});

describe("logError", () => {
  it("returns the message and logs with context in dev", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(logError(new Error("bad"), "Booking")).toBe("bad");
    expect(logError(new Error("bad2"))).toBe("bad2");
    expect(logError("plain")).toBe("Unknown error");
    if (import.meta.env.DEV) expect(spy).toHaveBeenCalled();
  });
});
