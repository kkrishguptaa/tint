import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { assessments, clients } from "@/db/schema";
import { requireTherapist } from "@/lib/auth";
import {
  getEligibleCardsForClient,
  normalizeAssessmentDeck,
  remapAnswers,
} from "@/lib/questions";
import { scoreAllDimensions } from "@/lib/scoring";
import { shuffleIds } from "@/lib/shuffle";
import type { Answers, DimensionId, HouseFloor, SwipeValue } from "@/lib/types";
import { DIMENSION_IDS } from "@/lib/types";

type Params = { params: Promise<{ id: string }> };

const STATUSES = [
  "cards",
  "review",
  "house",
  "outcome",
  "therapist",
  "complete",
] as const;

async function ownedClient(therapistId: string, clientId: string) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, clientId), eq(clients.therapistId, therapistId)))
    .limit(1);
  return row ?? null;
}

async function latestAssessment(clientId: string) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(assessments)
    .where(eq(assessments.clientId, clientId))
    .orderBy(desc(assessments.updatedAt))
    .limit(1);
  return row ?? null;
}

export async function GET(_request: Request, { params }: Params) {
  const session = await requireTherapist();
  if (!session?.therapistId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const client = await ownedClient(session.therapistId, id);
  if (!client) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let assessment = await latestAssessment(id);
  const db = getDb();

  if (!assessment) {
    const eligible = await getEligibleCardsForClient(session.therapistId, id);
    if (eligible.length === 0) {
      return NextResponse.json(
        { error: "No eligible questions" },
        { status: 400 },
      );
    }
    const [created] = await db
      .insert(assessments)
      .values({
        clientId: id,
        status: "cards",
        cardOrder: shuffleIds(eligible.map((c) => c.id)),
      })
      .returning();
    assessment = created;
  } else if (
    assessment.status === "cards" &&
    (assessment.cardOrder as string[]).length === 0
  ) {
    const eligible = await getEligibleCardsForClient(session.therapistId, id);
    const [updated] = await db
      .update(assessments)
      .set({
        cardOrder: shuffleIds(eligible.map((c) => c.id)),
        updatedAt: new Date(),
      })
      .where(eq(assessments.id, assessment.id))
      .returning();
    assessment = updated;
  }

  const normalized = await normalizeAssessmentDeck(
    assessment.cardOrder as string[],
    (assessment.answers || {}) as Answers,
  );

  if (normalized.changed) {
    const [updated] = await db
      .update(assessments)
      .set({
        cardOrder: normalized.cardOrder,
        answers: normalized.answers,
        updatedAt: new Date(),
      })
      .where(eq(assessments.id, assessment.id))
      .returning();
    assessment = updated;
  }

  return NextResponse.json({
    assessment,
    cards: normalized.cards,
  });
}

const patchSchema = z.object({
  answers: z.record(z.string(), z.enum(["dislike", "like", "love"])).optional(),
  house: z
    .record(
      z.string(),
      z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
    )
    .optional(),
  neglected: z.array(z.string()).optional(),
  appreciated: z.array(z.string()).optional(),
  hopes: z.array(z.string()).optional(),
  status: z.enum(STATUSES).optional(),
  fillRandom: z.boolean().optional(),
});

export async function PATCH(request: Request, { params }: Params) {
  const session = await requireTherapist();
  if (!session?.therapistId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const client = await ownedClient(session.therapistId, id);
  if (!client) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const assessment = await latestAssessment(id);
  if (!assessment) {
    return NextResponse.json({ error: "No assessment" }, { status: 404 });
  }

  const json = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const normalized = await normalizeAssessmentDeck(
    assessment.cardOrder as string[],
    (assessment.answers || {}) as Answers,
  );
  let cards = normalized.cards;
  if (cards.length === 0) {
    cards = await getEligibleCardsForClient(session.therapistId, id);
  }

  let answers = { ...normalized.answers };
  let status = assessment.status;
  let house = { ...(assessment.house as Record<string, number> | null) };
  let neglected = [...(assessment.neglected as string[])];
  let appreciated = [...(assessment.appreciated as string[])];
  let hopes = [...(assessment.hopes as string[])];
  let scores = assessment.scores as Record<string, { score: number }>;
  let completedAt = assessment.completedAt;
  let cardOrder = normalized.cardOrder;

  if (parsed.data.fillRandom) {
    const values: SwipeValue[] = ["dislike", "like", "love"];
    const fillCards =
      cards.length > 0
        ? cards
        : await getEligibleCardsForClient(session.therapistId, id);
    if (cardOrder.length === 0) {
      cardOrder = shuffleIds(fillCards.map((c) => c.id));
    }
    for (const cid of cardOrder) {
      answers[cid] = values[Math.floor(Math.random() * values.length)]!;
    }
    scores = scoreAllDimensions(fillCards, answers);
    status = "review";
  }

  if (parsed.data.answers) {
    const remapped = remapAnswers(
      parsed.data.answers as Answers,
      normalized.idMap,
    );
    answers = { ...answers, ...remapped };
    scores = scoreAllDimensions(cards, answers);
    const done = cardOrder.every((cid) => answers[cid]);
    if (done && status === "cards") status = "review";
  }

  if (parsed.data.house) {
    const placement = parsed.data.house as Record<DimensionId, HouseFloor>;
    const allPlaced = DIMENSION_IDS.every((d) => placement[d] !== undefined);
    if (!allPlaced) {
      return NextResponse.json({ error: "Place all dimensions" }, { status: 400 });
    }
    house = placement;
    if (status === "house") status = "outcome";
  }

  if (parsed.data.neglected) neglected = parsed.data.neglected;
  if (parsed.data.appreciated) appreciated = parsed.data.appreciated;
  if (parsed.data.hopes) hopes = parsed.data.hopes;

  if (parsed.data.status === "complete") {
    status = "complete";
    completedAt = new Date();
  } else if (parsed.data.status) {
    status = parsed.data.status;
  }

  const db = getDb();
  const [updated] = await db
    .update(assessments)
    .set({
      answers,
      scores,
      house,
      neglected,
      appreciated,
      hopes,
      status,
      cardOrder,
      completedAt,
      updatedAt: new Date(),
    })
    .where(eq(assessments.id, assessment.id))
    .returning();

  return NextResponse.json({ assessment: updated });
}
