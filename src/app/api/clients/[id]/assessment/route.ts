import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { assessments, clients } from "@/db/schema";
import { requireTherapist } from "@/lib/auth";
import { getCards } from "@/lib/content";
import { scoreAllDimensions } from "@/lib/scoring";
import type { Answers, DimensionId, HouseFloor, SwipeValue } from "@/lib/types";
import { DIMENSION_IDS } from "@/lib/types";

type Params = { params: Promise<{ id: string }> };

function shuffleIds(ids: string[]) {
  const copy = [...ids];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

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
  if (!assessment) {
    const db = getDb();
    const cardOrder = shuffleIds(getCards().map((c) => c.id));
    const [created] = await db
      .insert(assessments)
      .values({ clientId: id, status: "cards", cardOrder })
      .returning();
    assessment = created;
  }

  return NextResponse.json({ assessment });
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
  remarks: z.string().optional(),
  status: z.enum(["cards", "house", "therapist", "complete"]).optional(),
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

  const cards = getCards();
  let answers = { ...(assessment.answers as Answers) };
  let status = assessment.status;
  let house = { ...(assessment.house as Record<string, number> | null) };
  let neglected = [...(assessment.neglected as string[])];
  let appreciated = [...(assessment.appreciated as string[])];
  let hopes = [...(assessment.hopes as string[])];
  let remarks = assessment.remarks;
  let scores = assessment.scores as Record<string, { score: number }>;
  let completedAt = assessment.completedAt;

  if (parsed.data.fillRandom) {
    const values: SwipeValue[] = ["dislike", "like", "love"];
    for (const card of cards) {
      answers[card.id] = values[Math.floor(Math.random() * values.length)]!;
    }
    scores = scoreAllDimensions(cards, answers);
    status = "house";
  }

  if (parsed.data.answers) {
    answers = { ...answers, ...(parsed.data.answers as Answers) };
    scores = scoreAllDimensions(cards, answers);
    const order = assessment.cardOrder as string[];
    const done = order.every((cid) => answers[cid]);
    if (done && status === "cards") status = "house";
  }

  if (parsed.data.house) {
    const placement = parsed.data.house as Record<DimensionId, HouseFloor>;
    const allPlaced = DIMENSION_IDS.every((d) => placement[d] !== undefined);
    if (!allPlaced) {
      return NextResponse.json({ error: "Place all dimensions" }, { status: 400 });
    }
    house = placement;
    if (status === "house") status = "therapist";
  }

  if (parsed.data.neglected) neglected = parsed.data.neglected;
  if (parsed.data.appreciated) appreciated = parsed.data.appreciated;
  if (parsed.data.hopes) hopes = parsed.data.hopes;
  if (parsed.data.remarks !== undefined) remarks = parsed.data.remarks;

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
      remarks,
      status,
      completedAt,
      updatedAt: new Date(),
    })
    .where(eq(assessments.id, assessment.id))
    .returning();

  return NextResponse.json({ assessment: updated });
}
