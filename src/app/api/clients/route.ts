import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { assessments, clients, shareLinks, tags } from "@/db/schema";
import { requireTherapist } from "@/lib/auth";
import {
  getEligibleCardsForClient,
  setClientTags,
} from "@/lib/questions";
import { newShareToken, shuffleIds } from "@/lib/shuffle";

const createSchema = z.object({
  pseudonym: z.string().min(1),
  relationshipType: z.enum(["cis_het", "queer", "trans"]),
  linkedClientId: z.string().uuid().optional().nullable(),
  tagIds: z.array(z.string().uuid()).optional(),
  createShareLink: z.boolean().optional(),
});

export async function GET() {
  const session = await requireTherapist();
  if (!session?.therapistId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const allClients = await db
    .select()
    .from(clients)
    .where(eq(clients.therapistId, session.therapistId))
    .orderBy(desc(clients.createdAt));

  const result = [];
  for (const client of allClients) {
    const [assessment] = await db
      .select()
      .from(assessments)
      .where(eq(assessments.clientId, client.id))
      .orderBy(desc(assessments.updatedAt))
      .limit(1);
    result.push({
      id: client.id,
      pseudonym: client.pseudonym,
      relationshipType: client.relationshipType,
      linkedClientId: client.linkedClientId,
      createdAt: client.createdAt,
      assessmentId: assessment?.id ?? null,
      assessmentStatus: assessment?.status ?? null,
    });
  }

  return NextResponse.json({ clients: result });
}

export async function POST(request: Request) {
  const session = await requireTherapist();
  if (!session?.therapistId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const db = getDb();

  if (parsed.data.tagIds?.length) {
    const owned = await db
      .select()
      .from(tags)
      .where(eq(tags.therapistId, session.therapistId));
    const ownedIds = new Set(owned.map((t) => t.id));
    if (parsed.data.tagIds.some((id) => !ownedIds.has(id))) {
      return NextResponse.json({ error: "Invalid tags" }, { status: 400 });
    }
  }

  const [created] = await db
    .insert(clients)
    .values({
      therapistId: session.therapistId,
      pseudonym: parsed.data.pseudonym.trim(),
      relationshipType: parsed.data.relationshipType,
      linkedClientId: parsed.data.linkedClientId ?? null,
    })
    .returning();

  if (parsed.data.linkedClientId) {
    await db
      .update(clients)
      .set({ linkedClientId: created.id })
      .where(
        and(
          eq(clients.id, parsed.data.linkedClientId),
          eq(clients.therapistId, session.therapistId),
        ),
      );
  }

  if (parsed.data.tagIds?.length) {
    await setClientTags(created.id, parsed.data.tagIds);
  }

  const eligible = await getEligibleCardsForClient(
    session.therapistId,
    created.id,
  );
  if (eligible.length === 0) {
    return NextResponse.json(
      { error: "No eligible questions for this client" },
      { status: 400 },
    );
  }

  const cardOrder = shuffleIds(eligible.map((c) => c.id));
  const [assessment] = await db
    .insert(assessments)
    .values({
      clientId: created.id,
      status: "cards",
      cardOrder,
    })
    .returning();

  let shareUrl: string | null = null;
  if (parsed.data.createShareLink) {
    const token = newShareToken();
    await db.insert(shareLinks).values({
      assessmentId: assessment.id,
      token,
    });
    shareUrl = `/s/${token}`;
  }

  return NextResponse.json(
    { client: created, shareUrl, assessmentId: assessment.id },
    { status: 201 },
  );
}
