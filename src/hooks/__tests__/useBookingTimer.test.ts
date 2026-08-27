import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useBookingTimer } from "@/hooks/useBookingTimer";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("useBookingTimer", () => {
  it("stays idle while inactive", () => {
    const { result } = renderHook(() => useBookingTimer(false));
    expect(result.current.timeLeft).toBe(600);
    expect(result.current.formattedTime).toBe("10:00");
    act(() => void vi.advanceTimersByTime(5000));
    expect(result.current.timeLeft).toBe(600);
  });

  it("counts down and formats seconds with a leading zero", () => {
    const { result } = renderHook(() => useBookingTimer(true));
    act(() => void vi.advanceTimersByTime(5000));
    expect(result.current.timeLeft).toBe(595);
    expect(result.current.formattedTime).toBe("9:55");
    expect(result.current.isExpired).toBe(false);
  });

  it("expires at zero and stops ticking", () => {
    const { result } = renderHook(() => useBookingTimer(true));
    act(() => void vi.advanceTimersByTime(600_000));
    expect(result.current.timeLeft).toBe(0);
    expect(result.current.isExpired).toBe(true);
    act(() => void vi.advanceTimersByTime(5000));
    expect(result.current.timeLeft).toBe(0);
  });

  it("resets when it becomes inactive again", () => {
    const { result, rerender } = renderHook(
      ({ active }) => useBookingTimer(active),
      {
        initialProps: { active: true },
      },
    );
    act(() => void vi.advanceTimersByTime(10_000));
    expect(result.current.timeLeft).toBe(590);
    rerender({ active: false });
    expect(result.current.timeLeft).toBe(600);
    expect(result.current.isExpired).toBe(false);
  });
});
