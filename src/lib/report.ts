import { scoreAllDimensions } from "./scoring";
import type { Answers, Card, Report } from "./types";
import { buildVenn } from "./venn";

export function buildReport(input: {
  cards: Card[];
  partnerAName: string;
  partnerBName: string;
  answersA: Answers;
  answersB: Answers;
  createdAt?: string;
}): Report {
  const scoresA = scoreAllDimensions(input.cards, input.answersA);
  const scoresB = scoreAllDimensions(input.cards, input.answersB);
  const venn = buildVenn(input.cards, input.answersA, input.answersB);
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
    cardTitles,
  };
}
