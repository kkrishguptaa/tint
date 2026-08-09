import cardsJson from "../../data/cards.json";
import { z } from "zod";
import type { Card } from "./types";
import { DIMENSION_IDS } from "./types";

const dimensionSchema = z.enum(DIMENSION_IDS);

const cardSchema = z.object({
  id: z.string().min(1),
  dimension: dimensionSchema,
  title: z.string().min(1),
  prompt: z.string().min(1),
});

let cardsCache: Card[] | null = null;

export function getCards(): Card[] {
  cardsCache ??= cardSchema.array().parse(cardsJson);
  return cardsCache;
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
