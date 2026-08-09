import { selectRecommendations } from "./recommendations";
import { scoreAllDimensions } from "./scoring";
import type { Answers, Card, RecommendationCatalog, Report } from "./types";
import { buildVenn } from "./venn";

export function buildReport(input: {
  cards: Card[];
  catalog: RecommendationCatalog;
  partnerAName: string;
  partnerBName: string;
  answersA: Answers;
  answersB: Answers;
  createdAt?: string;
}): Report {
  const scoresA = scoreAllDimensions(input.cards, input.answersA);
  const scoresB = scoreAllDimensions(input.cards, input.answersB);
  const venn = buildVenn(input.cards, input.answersA, input.answersB);
  const tips = selectRecommendations(scoresA, scoresB, venn, input.catalog);
  const cardTitles = Object.fromEntries(
    input.cards.map((card) => [card.id, card.title]),
  );

  return {
    version: 1,
    createdAt: input.createdAt ?? new Date().toISOString(),
    partnerAName: input.partnerAName.trim() || "Partner A",
    partnerBName: input.partnerBName.trim() || "Partner B",
    scoresA,
    scoresB,
    venn,
    bandTips: tips.bandTips,
    overlapTips: tips.overlapTips,
    cardTitles,
  };
}
