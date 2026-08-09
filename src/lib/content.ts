import cardsJson from "../../data/cards.json";
import recommendationsJson from "../../data/recommendations.json";
import { z } from "zod";
import type { Card, RecommendationCatalog } from "./types";
import { DIMENSION_IDS } from "./types";

const dimensionSchema = z.enum(DIMENSION_IDS);

const cardSchema = z.object({
  id: z.string().min(1),
  dimension: dimensionSchema,
  title: z.string().min(1),
  prompt: z.string().min(1),
});

const catalogSchema = z.object({
  bandTips: z.array(
    z.object({
      id: z.string(),
      kind: z.literal("band"),
      dimension: dimensionSchema,
      bands: z.tuple([
        z.enum(["low", "mid", "high"]),
        z.enum(["low", "mid", "high"]),
      ]),
      title: z.string(),
      body: z.string(),
      priority: z.number().optional(),
    }),
  ),
  overlapTips: z.array(
    z.object({
      id: z.string(),
      kind: z.literal("overlap"),
      match: z.enum(["strong_common", "common", "a_only", "b_only"]),
      cardIds: z.array(z.string()).optional(),
      title: z.string(),
      body: z.string(),
      priority: z.number().optional(),
    }),
  ),
});

let cardsCache: Card[] | null = null;
let catalogCache: RecommendationCatalog | null = null;

export function getCards(): Card[] {
  cardsCache ??= cardSchema.array().parse(cardsJson);
  return cardsCache;
}

export function getRecommendationCatalog(): RecommendationCatalog {
  catalogCache ??= catalogSchema.parse(recommendationsJson);
  return catalogCache;
}

export const DIMENSION_LABELS: Record<(typeof DIMENSION_IDS)[number], string> = {
  physical_sexual: "Physical + sexual",
  emotional: "Emotional",
  intellectual: "Intellectual",
  spiritual: "Spiritual",
  experiential: "Experiential",
  creative: "Creative",
  financial: "Financial",
  social: "Social",
  conflict: "Conflict",
  aesthetic: "Aesthetic",
};
