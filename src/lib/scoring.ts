import type { Answers, Band, Card, DimensionId, DimensionScore, SwipeValue } from "./types";
import { DIMENSION_IDS } from "./types";

const VALUE: Record<SwipeValue, number> = {
  dislike: 0,
  like: 1,
  love: 2,
};

export function bandForScore(score: number): Band {
  if (score <= 33) return "low";
  if (score <= 66) return "mid";
  return "high";
}

export function scoreDimension(answers: SwipeValue[]): DimensionScore {
  if (answers.length === 0) {
    return { score: 0, band: "low" };
  }

  const nums = answers.map((a) => VALUE[a]);
  const affinity = nums.reduce((sum, n) => sum + n, 0) / nums.length / 2;
  const breadth = nums.filter((n) => n >= 1).length / nums.length;
  const score = Math.round((0.6 * affinity + 0.4 * breadth) * 100);

  return { score, band: bandForScore(score) };
}

export function scoreAllDimensions(
  cards: Card[],
  answers: Answers,
): Record<DimensionId, DimensionScore> {
  const result = {} as Record<DimensionId, DimensionScore>;

  for (const dimension of DIMENSION_IDS) {
    const values = cards
      .filter((card) => card.dimension === dimension)
      .map((card) => answers[card.id])
      .filter((value): value is SwipeValue => value !== undefined);
    result[dimension] = scoreDimension(values);
  }

  return result;
}
