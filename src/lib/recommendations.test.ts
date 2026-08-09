import { describe, expect, it } from "vitest";
import { selectRecommendations } from "./recommendations";
import type { RecommendationCatalog } from "./types";
import { DIMENSION_IDS } from "./types";

function flatScores(score: number, band: "low" | "mid" | "high") {
  return Object.fromEntries(
    DIMENSION_IDS.map((id) => [id, { score, band }]),
  ) as ReturnType<typeof Object.fromEntries> as Record<
    (typeof DIMENSION_IDS)[number],
    { score: number; band: "low" | "mid" | "high" }
  >;
}

describe("selectRecommendations", () => {
  const catalog: RecommendationCatalog = {
    bandTips: [
      {
        id: "b1",
        kind: "band",
        dimension: "emotional",
        bands: ["high", "low"],
        title: "Bridge the gap",
        body: "Talk about emotional pace.",
      },
    ],
    overlapTips: [
      {
        id: "o1",
        kind: "overlap",
        match: "strong_common",
        cardIds: ["card-1"],
        title: "Lean into this",
        body: "You both love this.",
      },
    ],
  };

  it("picks band and overlap tips", () => {
    const scoresA = flatScores(80, "high");
    const scoresB = { ...flatScores(80, "high"), emotional: { score: 10, band: "low" as const } };
    const result = selectRecommendations(
      scoresA,
      scoresB,
      { strongCommon: ["card-1"], common: [], aOnly: [], bOnly: [] },
      catalog,
    );
    expect(result.bandTips.map((t) => t.id)).toContain("b1");
    expect(result.overlapTips.map((t) => t.id)).toContain("o1");
  });
});
