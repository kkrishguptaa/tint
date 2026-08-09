import { scoreAllDimensions } from "./scoring";
import type {
  Answers,
  Card,
  HouseFloor,
  Report,
} from "./types";
import { DIMENSION_IDS } from "./types";
import { buildVenn } from "./venn";

function emptyHouse(): Record<(typeof DIMENSION_IDS)[number], HouseFloor> {
  return Object.fromEntries(
    DIMENSION_IDS.map((id) => [id, 1]),
  ) as Record<(typeof DIMENSION_IDS)[number], HouseFloor>;
}

export function buildReport(input: {
  cards: Card[];
  partnerAName: string;
  partnerBName: string;
  answersA: Answers;
  answersB: Answers;
  houseA: Record<(typeof DIMENSION_IDS)[number], HouseFloor>;
  houseB: Record<(typeof DIMENSION_IDS)[number], HouseFloor>;
  notesA: string;
  notesB: string;
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
    houseA: input.houseA,
    houseB: input.houseB,
    notesA: input.notesA.trim(),
    notesB: input.notesB.trim(),
    venn,
    cardTitles,
  };
}

export { emptyHouse };
