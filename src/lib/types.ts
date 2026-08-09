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

export type DimensionScore = {
  score: number;
};

export type Card = {
  id: string;
  dimension: DimensionId;
  title: string;
  prompt: string;
};

export type Answers = Record<string, SwipeValue>;

/** 4 = hardest to open about (top), 1 = easiest (bottom) */
export type HouseFloor = 1 | 2 | 3 | 4;

export type HousePlacement = Partial<Record<DimensionId, HouseFloor>>;

export type PartnerSession = {
  name: string;
  answers: Answers;
  scores: Record<DimensionId, DimensionScore>;
  house: Record<DimensionId, HouseFloor>;
  therapistNotes: string;
};

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
  houseA: Record<DimensionId, HouseFloor>;
  houseB: Record<DimensionId, HouseFloor>;
  notesA: string;
  notesB: string;
  venn: VennSets;
  cardTitles: Record<string, string>;
};

export const HOUSE_FLOOR_LABELS: Record<HouseFloor, string> = {
  4: "Hardest to open about",
  3: "Harder to open about",
  2: "Easier to open about",
  1: "Easiest to open about",
};
