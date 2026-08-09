import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { assessments, clients } from "@/db/schema";
import { requireTherapist } from "@/lib/auth";
import { getCards } from "@/lib/content";

function shuffleIds(ids: string[]) {
  const copy = [...ids];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const createSchema = z.object({
  pseudonym: z.string().min(1),
  relationshipType: z.enum(["cis_het", "queer", "trans"]),
  linkedClientId: z.string().uuid().optional().nullable(),
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
      .where(eq(clients.id, parsed.data.linkedClientId));
  }

  const cardOrder = shuffleIds(getCards().map((c) => c.id));
  await db.insert(assessments).values({
    clientId: created.id,
    status: "cards",
    cardOrder,
  });

  return NextResponse.json({ client: created }, { status: 201 });
}
