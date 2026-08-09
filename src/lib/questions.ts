import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import {
  clientTags,
  questionTags,
  questions,
  tags,
} from "@/db/schema";
import type { Card, DimensionId } from "@/lib/types";

export type QuestionRow = typeof questions.$inferSelect;

export function isEligibleQuestion(
  questionTagIds: Set<string> | undefined,
  clientTagIds: Set<string>,
): boolean {
  if (!questionTagIds || questionTagIds.size === 0) return true;
  for (const tid of questionTagIds) {
    if (clientTagIds.has(tid)) return true;
  }
  return false;
}

export function toCard(row: QuestionRow): Card {
  return {
    id: row.id,
    dimension: row.dimension as DimensionId,
    title: row.title,
    prompt: row.prompt,
  };
}

/** Active questions for a client: untagged OR sharing ≥1 tag with the client. */
export async function getEligibleCardsForClient(
  therapistId: string,
  clientId: string,
): Promise<Card[]> {
  const db = getDb();
  const allQs = await db
    .select()
    .from(questions)
    .where(
      and(eq(questions.therapistId, therapistId), eq(questions.active, true)),
    );

  if (allQs.length === 0) return [];

  const qIds = allQs.map((q) => q.id);
  const qTagRows =
    qIds.length === 0
      ? []
      : await db
          .select()
          .from(questionTags)
          .where(inArray(questionTags.questionId, qIds));

  const tagsByQuestion = new Map<string, Set<string>>();
  for (const row of qTagRows) {
    const set = tagsByQuestion.get(row.questionId) ?? new Set();
    set.add(row.tagId);
    tagsByQuestion.set(row.questionId, set);
  }

  const cTagRows = await db
    .select()
    .from(clientTags)
    .where(eq(clientTags.clientId, clientId));
  const clientTagSet = new Set(cTagRows.map((r) => r.tagId));

  return allQs
    .filter((q) => isEligibleQuestion(tagsByQuestion.get(q.id), clientTagSet))
    .map(toCard);
}

export async function getCardsByIds(ids: string[]): Promise<Card[]> {
  if (ids.length === 0) return [];
  const db = getDb();
  const rows = await db.select().from(questions).where(inArray(questions.id, ids));
  const byId = new Map(rows.map((r) => [r.id, toCard(r)]));
  return ids.map((id) => byId.get(id)).filter(Boolean) as Card[];
}

export async function listQuestionsWithTags(therapistId: string) {
  const db = getDb();
  const qs = await db
    .select()
    .from(questions)
    .where(eq(questions.therapistId, therapistId));
  const qIds = qs.map((q) => q.id);
  const links =
    qIds.length === 0
      ? []
      : await db
          .select()
          .from(questionTags)
          .where(inArray(questionTags.questionId, qIds));
  const tagIds = [...new Set(links.map((l) => l.tagId))];
  const tagRows =
    tagIds.length === 0
      ? []
      : await db.select().from(tags).where(inArray(tags.id, tagIds));
  const tagById = new Map(tagRows.map((t) => [t.id, t]));

  return qs.map((q) => ({
    ...q,
    tags: links
      .filter((l) => l.questionId === q.id)
      .map((l) => tagById.get(l.tagId))
      .filter(Boolean),
  }));
}

export async function getClientTagIds(clientId: string): Promise<string[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(clientTags)
    .where(eq(clientTags.clientId, clientId));
  return rows.map((r) => r.tagId);
}

export async function setClientTags(clientId: string, tagIds: string[]) {
  const db = getDb();
  await db.delete(clientTags).where(eq(clientTags.clientId, clientId));
  if (tagIds.length === 0) return;
  await db.insert(clientTags).values(
    tagIds.map((tagId) => ({ clientId, tagId })),
  );
}

export async function setQuestionTags(questionId: string, tagIds: string[]) {
  const db = getDb();
  await db.delete(questionTags).where(eq(questionTags.questionId, questionId));
  if (tagIds.length === 0) return;
  await db.insert(questionTags).values(
    tagIds.map((tagId) => ({ questionId, tagId })),
  );
}
