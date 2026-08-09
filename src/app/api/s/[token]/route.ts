import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { assessments, clients, shareLinks } from "@/db/schema";
import {
  normalizeAssessmentDeck,
  remapAnswers,
} from "@/lib/questions";
import { scoreAllDimensions } from "@/lib/scoring";
import type { Answers, SwipeValue } from "@/lib/types";

type Params = { params: Promise<{ token: string }> };

async function loadByToken(token: string) {
  const db = getDb();
  const [link] = await db
    .select()
    .from(shareLinks)
    .where(eq(shareLinks.token, token))
    .limit(1);
  if (!link) return null;
  if (link.expiresAt && link.expiresAt.getTime() < Date.now()) return null;

  let [assessment] = await db
    .select()
    .from(assessments)
    .where(eq(assessments.id, link.assessmentId))
    .limit(1);
  if (!assessment) return null;

  const [client] = await db
    .select()
    .from(clients)
    .where(eq(clients.id, assessment.clientId))
    .limit(1);
  if (!client) return null;

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

  return {
    link,
    assessment,
    client,
    cards: normalized.cards,
    idMap: normalized.idMap,
  };
}

export async function GET(_request: Request, { params }: Params) {
  const { token } = await params;
  const bundle = await loadByToken(token);
  if (!bundle) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({
    client: { id: bundle.client.id, pseudonym: bundle.client.pseudonym },
    assessment: {
      id: bundle.assessment.id,
      status: bundle.assessment.status,
      cardOrder: bundle.assessment.cardOrder,
      answers: bundle.assessment.answers,
    },
    cards: bundle.cards,
  });
}

const patchSchema = z.object({
  answers: z.record(z.string(), z.enum(["dislike", "like", "love"])).optional(),
  fillRandom: z.boolean().optional(),
});

export async function PATCH(request: Request, { params }: Params) {
  const { token } = await params;
  const bundle = await loadByToken(token);
  if (!bundle) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (bundle.assessment.status !== "cards") {
    return NextResponse.json(
      { error: "Swipe already finished" },
      { status: 400 },
    );
  }

  const json = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const order = bundle.assessment.cardOrder as string[];
  let answers = { ...(bundle.assessment.answers as Answers) };
  let status:
    | "cards"
    | "review"
    | "house"
    | "outcome"
    | "therapist"
    | "complete" = "cards";
  let scores = bundle.assessment.scores as Record<string, { score: number }>;

  if (parsed.data.fillRandom) {
    const values: SwipeValue[] = ["dislike", "like", "love"];
    for (const cid of order) {
      answers[cid] = values[Math.floor(Math.random() * values.length)]!;
    }
    scores = scoreAllDimensions(bundle.cards, answers);
    status = "review";
  }

  if (parsed.data.answers) {
    const remapped = remapAnswers(
      parsed.data.answers as Answers,
      bundle.idMap,
    );
    answers = { ...answers, ...remapped };
    scores = scoreAllDimensions(bundle.cards, answers);
    if (order.every((cid) => answers[cid])) status = "review";
  }

  const db = getDb();
  const [updated] = await db
    .update(assessments)
    .set({
      answers,
      scores,
      status,
      updatedAt: new Date(),
    })
    .where(eq(assessments.id, bundle.assessment.id))
    .returning();

  return NextResponse.json({
    assessment: {
      id: updated.id,
      status: updated.status,
      cardOrder: updated.cardOrder,
      answers: updated.answers,
    },
  });
}
