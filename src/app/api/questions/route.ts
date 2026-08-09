import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { questions, tags } from "@/db/schema";
import { requireTherapist } from "@/lib/auth";
import { listQuestionsWithTags, setQuestionTags } from "@/lib/questions";
import { DIMENSION_IDS } from "@/lib/types";

export async function GET() {
  const session = await requireTherapist();
  if (!session?.therapistId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const rows = await listQuestionsWithTags(session.therapistId);
  return NextResponse.json({ questions: rows });
}

const createSchema = z.object({
  dimension: z.enum(DIMENSION_IDS),
  title: z.string().trim().min(1),
  prompt: z.string().trim().min(1),
  active: z.boolean().optional(),
  tagIds: z.array(z.string().uuid()).optional(),
});

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
    .insert(questions)
    .values({
      therapistId: session.therapistId,
      dimension: parsed.data.dimension,
      title: parsed.data.title,
      prompt: parsed.data.prompt,
      active: parsed.data.active ?? true,
    })
    .returning();

  if (parsed.data.tagIds?.length) {
    await setQuestionTags(created.id, parsed.data.tagIds);
  }

  return NextResponse.json({ question: created }, { status: 201 });
}

const patchSchema = z.object({
  id: z.string().uuid(),
  dimension: z.enum(DIMENSION_IDS).optional(),
  title: z.string().trim().min(1).optional(),
  prompt: z.string().trim().min(1).optional(),
  active: z.boolean().optional(),
  tagIds: z.array(z.string().uuid()).optional(),
});

export async function PATCH(request: Request) {
  const session = await requireTherapist();
  if (!session?.therapistId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const json = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const db = getDb();
  const [existing] = await db
    .select()
    .from(questions)
    .where(
      and(
        eq(questions.id, parsed.data.id),
        eq(questions.therapistId, session.therapistId),
      ),
    )
    .limit(1);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (parsed.data.tagIds) {
    const owned = await db
      .select()
      .from(tags)
      .where(eq(tags.therapistId, session.therapistId));
    const ownedIds = new Set(owned.map((t) => t.id));
    if (parsed.data.tagIds.some((id) => !ownedIds.has(id))) {
      return NextResponse.json({ error: "Invalid tags" }, { status: 400 });
    }
    await setQuestionTags(existing.id, parsed.data.tagIds);
  }

  const [updated] = await db
    .update(questions)
    .set({
      ...(parsed.data.dimension ? { dimension: parsed.data.dimension } : {}),
      ...(parsed.data.title ? { title: parsed.data.title } : {}),
      ...(parsed.data.prompt ? { prompt: parsed.data.prompt } : {}),
      ...(parsed.data.active !== undefined ? { active: parsed.data.active } : {}),
      updatedAt: new Date(),
    })
    .where(eq(questions.id, existing.id))
    .returning();

  return NextResponse.json({ question: updated });
}

const deleteSchema = z.object({ id: z.string().uuid() });

export async function DELETE(request: Request) {
  const session = await requireTherapist();
  if (!session?.therapistId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const json = await request.json().catch(() => null);
  const parsed = deleteSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const db = getDb();
  const [deleted] = await db
    .delete(questions)
    .where(
      and(
        eq(questions.id, parsed.data.id),
        eq(questions.therapistId, session.therapistId),
      ),
    )
    .returning();
  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
