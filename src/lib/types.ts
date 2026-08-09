export const DIMENSION_IDS = [
  "physical_sexual",
  "emotional",
  "intellectual",
  "spiritual",
  "experiential",
  "creative",
  "financial",
  "social",
  "conflict",
  "aesthetic",
] as const;

export type DimensionId = (typeof DIMENSION_IDS)[number];

export type SwipeValue = "dislike" | "like" | "love";

export type Band = "low" | "mid" | "high";

export type DimensionScore = {
  score: number;
  band: Band;
};

export type Card = {
  id: string;
  dimension: DimensionId;
  title: string;
  prompt: string;
};

export type Answers = Record<string, SwipeValue>;

export type VennSets = {
  strongCommon: string[];
  common: string[];
  aOnly: string[];
  bOnly: string[];
};

export type Report = {
  version: 1;
  createdAt: string;
  partnerAName: string;
  partnerBName: string;
  scoresA: Record<DimensionId, DimensionScore>;
  scoresB: Record<DimensionId, DimensionScore>;
  venn: VennSets;
  cardTitles: Record<string, string>;
};
