import { describe, expect, it } from "vitest";
import { scoreAllDimensions, scoreDimension } from "./scoring";
import type { Card } from "./types";

describe("scoreDimension", () => {
  it("scores all love as ~100", () => {
    const r = scoreDimension(["love", "love", "love"]);
    expect(r.score).toBe(100);
  });

  it("scores all dislike as 0", () => {
    const r = scoreDimension(["dislike", "dislike"]);
    expect(r.score).toBe(0);
  });

  it("blends affinity and breadth", () => {
    const r = scoreDimension(["love", "dislike"]);
    expect(r.score).toBe(50);
  });
});

describe("scoreAllDimensions", () => {
  it("groups by dimension", () => {
    const cards: Card[] = [
      {
        id: "e1",
        dimension: "emotional",
        title: "Check-ins",
        prompt: "Weekly emotional check-ins",
      },
      {
        id: "e2",
        dimension: "emotional",
        title: "Vulnerability",
        prompt: "Sharing hard feelings",
      },
      {
        id: "c1",
        dimension: "creative",
        title: "Make art",
        prompt: "Making things together",
      },
    ];

    const scores = scoreAllDimensions(cards, {
      e1: "love",
      e2: "love",
      c1: "dislike",
    });

    expect(scores.emotional.score).toBe(100);
    expect(scores.creative.score).toBe(0);
  });
});
