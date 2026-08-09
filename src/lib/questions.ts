import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import {
  clientTags,
  questionTags,
  questions,
  tags,
} from "@/db/schema";
import type { Answers, Card, DimensionId } from "@/lib/types";

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

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: string) {
  return UUID_RE.test(value);
}

/**
 * Resolve card_order ids that may be either question UUIDs or legacy keys
 * from the old cards.json seed. Always returns cards keyed by UUID.
 */
export async function getCardsByIds(ids: string[]): Promise<Card[]> {
  const { cards } = await resolveCardsFromOrder(ids);
  return cards;
}

export async function resolveCardsFromOrder(ids: string[]): Promise<{
  cards: Card[];
  /** UUID order parallel to `cards` (legacy keys rewritten). */
  order: string[];
  /** Maps any input id (uuid or legacy) → question UUID. */
  idMap: Map<string, string>;
  changed: boolean;
}> {
  if (ids.length === 0) {
    return { cards: [], order: [], idMap: new Map(), changed: false };
  }

  const db = getDb();
  const uuids = ids.filter(isUuid);
  const legacy = ids.filter((id) => !isUuid(id));

  const rows: QuestionRow[] = [];
  if (uuids.length) {
    rows.push(
      ...(await db.select().from(questions).where(inArray(questions.id, uuids))),
    );
  }
  if (legacy.length) {
    rows.push(
      ...(await db
        .select()
        .from(questions)
        .where(inArray(questions.legacyKey, legacy))),
    );
  }

  const byUuid = new Map(rows.map((r) => [r.id, r]));
  const byLegacy = new Map(
    rows
      .filter((r) => r.legacyKey)
      .map((r) => [r.legacyKey as string, r]),
  );

  const idMap = new Map<string, string>();
  const order: string[] = [];
  const cards: Card[] = [];
  let changed = false;

  for (const id of ids) {
    const row = isUuid(id) ? byUuid.get(id) : byLegacy.get(id);
    if (!row) continue;
    if (id !== row.id) changed = true;
    idMap.set(id, row.id);
    order.push(row.id);
    cards.push(toCard(row));
  }

  return { cards, order, idMap, changed };
}

export function remapAnswers(
  answers: Answers,
  idMap: Map<string, string>,
): Answers {
  const next: Answers = {};
  for (const [key, value] of Object.entries(answers)) {
    const mapped = idMap.get(key) ?? (isUuid(key) ? key : undefined);
    if (mapped && value) next[mapped] = value;
  }
  return next;
}

/** Rewrite legacy card_order / answer keys to question UUIDs. */
export async function normalizeAssessmentDeck(
  cardOrder: string[],
  answers: Answers,
): Promise<{
  cards: Card[];
  cardOrder: string[];
  answers: Answers;
  changed: boolean;
  idMap: Map<string, string>;
}> {
  const resolved = await resolveCardsFromOrder(cardOrder);
  const idMap = new Map(resolved.idMap);

  const orphanKeys = Object.keys(answers).filter(
    (k) => !idMap.has(k) && !isUuid(k),
  );
  if (orphanKeys.length) {
    const extra = await resolveCardsFromOrder(orphanKeys);
    for (const [k, v] of extra.idMap) idMap.set(k, v);
  }

  for (const id of cardOrder) {
    if (isUuid(id) && !idMap.has(id)) idMap.set(id, id);
  }

  const nextAnswers = remapAnswers(answers, idMap);
  const changed =
    resolved.changed || Object.keys(answers).some((k) => !isUuid(k));

  return {
    cards: resolved.cards,
    cardOrder: resolved.order,
    answers: nextAnswers,
    changed,
    idMap,
  };
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
