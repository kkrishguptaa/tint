import { describe, expect, it } from "vitest";
import { buildVenn } from "./venn";
import type { Card } from "./types";

const cards: Card[] = [
  { id: "1", dimension: "emotional", title: "A", prompt: "A" },
  { id: "2", dimension: "emotional", title: "B", prompt: "B" },
  { id: "3", dimension: "emotional", title: "C", prompt: "C" },
  { id: "4", dimension: "emotional", title: "D", prompt: "D" },
  { id: "5", dimension: "emotional", title: "E", prompt: "E" },
];

describe("buildVenn", () => {
  it("classifies intensity-aware buckets", () => {
    const venn = buildVenn(
      cards,
      {
        "1": "love",
        "2": "like",
        "3": "like",
        "4": "dislike",
        "5": "dislike",
      },
      {
        "1": "love",
        "2": "love",
        "3": "dislike",
        "4": "like",
        "5": "dislike",
      },
    );

    expect(venn.strongCommon).toEqual(["1"]);
    expect(venn.common).toEqual(["2"]);
    expect(venn.aOnly).toEqual(["3"]);
    expect(venn.bOnly).toEqual(["4"]);
  });
});
