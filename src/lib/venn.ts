import type { Answers, Card, SwipeValue, VennSets } from "./types";

function liked(value: SwipeValue | undefined): boolean {
  return value === "like" || value === "love";
}

export function buildVenn(
  cards: Card[],
  answersA: Answers,
  answersB: Answers,
): VennSets {
  const strongCommon: string[] = [];
  const common: string[] = [];
  const aOnly: string[] = [];
  const bOnly: string[] = [];

  for (const card of cards) {
    const a = answersA[card.id];
    const b = answersB[card.id];
    if (!a || !b) continue;

    if (a === "love" && b === "love") {
      strongCommon.push(card.id);
      continue;
    }

    if (liked(a) && liked(b)) {
      common.push(card.id);
      continue;
    }

    if (liked(a) && b === "dislike") {
      aOnly.push(card.id);
      continue;
    }

    if (liked(b) && a === "dislike") {
      bOnly.push(card.id);
    }
  }

  return { strongCommon, common, aOnly, bOnly };
}
