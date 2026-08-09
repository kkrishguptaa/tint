import { describe, expect, it } from "vitest";
import { isEligibleQuestion } from "./questions";

describe("deck eligibility", () => {
  it("includes untagged for any client", () => {
    expect(isEligibleQuestion(undefined, new Set(["a"]))).toBe(true);
    expect(isEligibleQuestion(new Set(), new Set())).toBe(true);
  });

  it("includes tagged when client shares a tag", () => {
    expect(isEligibleQuestion(new Set(["a", "b"]), new Set(["b"]))).toBe(true);
  });

  it("excludes tagged when client has no overlap", () => {
    expect(isEligibleQuestion(new Set(["a"]), new Set(["b"]))).toBe(false);
    expect(isEligibleQuestion(new Set(["a"]), new Set())).toBe(false);
  });
});
