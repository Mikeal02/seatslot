import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("drops falsy values", () => {
    expect(cn("a", false && "b", undefined, null)).toBe("a");
  });

  it("resolves conflicting tailwind utilities in favor of the last one", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });
});
