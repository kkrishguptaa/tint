import type {
  Band,
  BandTip,
  DimensionId,
  DimensionScore,
  OverlapTip,
  RecommendationCatalog,
  VennSets,
} from "./types";
import { DIMENSION_IDS } from "./types";

function bandsMatch(tip: BandTip, a: Band, b: Band): boolean {
  const [x, y] = tip.bands;
  return (x === a && y === b) || (x === b && y === a);
}

export function selectRecommendations(
  scoresA: Record<DimensionId, DimensionScore>,
  scoresB: Record<DimensionId, DimensionScore>,
  venn: VennSets,
  catalog: RecommendationCatalog,
): { bandTips: BandTip[]; overlapTips: OverlapTip[] } {
  const dimensionOrder = [...DIMENSION_IDS].sort((d1, d2) => {
    const gap1 = Math.abs(scoresA[d1].score - scoresB[d1].score);
    const gap2 = Math.abs(scoresA[d2].score - scoresB[d2].score);
    if (gap2 !== gap1) return gap2 - gap1;
    const joint1 = scoresA[d1].score + scoresB[d1].score;
    const joint2 = scoresA[d2].score + scoresB[d2].score;
    return joint1 - joint2;
  });

  const bandTips: BandTip[] = [];
  for (const dimension of dimensionOrder) {
    if (bandTips.length >= 3) break;
    const match = catalog.bandTips
      .filter(
        (tip) =>
          tip.dimension === dimension &&
          bandsMatch(tip, scoresA[dimension].band, scoresB[dimension].band),
      )
      .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))[0];
    if (match && !bandTips.some((t) => t.id === match.id)) {
      bandTips.push(match);
    }
  }

  const overlapTips: OverlapTip[] = [];
  const buckets: Array<{
    match: OverlapTip["match"];
    ids: string[];
  }> = [
    { match: "strong_common", ids: venn.strongCommon },
    { match: "common", ids: venn.common },
    { match: "a_only", ids: venn.aOnly },
    { match: "b_only", ids: venn.bOnly },
  ];

  for (const bucket of buckets) {
    for (const tip of catalog.overlapTips
      .filter((t) => t.match === bucket.match)
      .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))) {
      if (overlapTips.length >= 5) break;
      const cardIds = tip.cardIds ?? [];
      const hits =
        cardIds.length === 0
          ? bucket.ids.length > 0
          : cardIds.some((id) => bucket.ids.includes(id));
      if (hits && !overlapTips.some((t) => t.id === tip.id)) {
        overlapTips.push(tip);
      }
    }
    if (overlapTips.length >= 5) break;
  }

  return { bandTips, overlapTips };
}
