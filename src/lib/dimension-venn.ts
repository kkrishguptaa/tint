import type {
  DimensionId,
  DimensionScore,
  VennSets,
} from "./types";
import { DIMENSION_IDS } from "./types";

/** Dimension is "in" for type-level Venn when score >= 50. */
export function dimensionsInSet(
  scores: Record<DimensionId, DimensionScore> | Record<string, { score: number }>,
): Set<DimensionId> {
  const set = new Set<DimensionId>();
  for (const id of DIMENSION_IDS) {
    if ((scores[id]?.score ?? 0) >= 50) set.add(id);
  }
  return set;
}

export function buildDimensionVenn(
  scoresA: Record<string, { score: number }>,
  scoresB: Record<string, { score: number }>,
): VennSets {
  const a = dimensionsInSet(scoresA);
  const b = dimensionsInSet(scoresB);
  const strongCommon: string[] = [];
  const common: string[] = [];
  const aOnly: string[] = [];
  const bOnly: string[] = [];

  for (const id of DIMENSION_IDS) {
    const inA = a.has(id);
    const inB = b.has(id);
    if (inA && inB) {
      if ((scoresA[id]?.score ?? 0) >= 67 && (scoresB[id]?.score ?? 0) >= 67) {
        strongCommon.push(id);
      } else {
        common.push(id);
      }
    } else if (inA) aOnly.push(id);
    else if (inB) bOnly.push(id);
  }

  return { strongCommon, common, aOnly, bOnly };
}
