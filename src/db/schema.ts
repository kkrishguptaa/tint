import {
  boolean,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const relationshipTypeEnum = pgEnum("relationship_type", [
  "cis_het",
  "queer",
  "trans",
]);

export const assessmentStatusEnum = pgEnum("assessment_status", [
  "cards",
  "review",
  "house",
  "outcome",
  "therapist",
  "complete",
]);

export const dimensionEnum = pgEnum("dimension", [
  "physical_sexual",
  "emotional",
  "intellectual",
  "spiritual",
  "experiential",
  "creative",
  "financial",
  "social",
  "conflict",
  "aesthetic",
]);

export const therapists = pgTable("therapists", {
  id: uuid("id").defaultRandom().primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const tags = pgTable(
  "tags",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    therapistId: uuid("therapist_id")
      .notNull()
      .references(() => therapists.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [uniqueIndex("tags_therapist_name").on(t.therapistId, t.name)],
);

export const questions = pgTable("questions", {
  id: uuid("id").defaultRandom().primaryKey(),
  therapistId: uuid("therapist_id")
    .notNull()
    .references(() => therapists.id, { onDelete: "cascade" }),
  dimension: dimensionEnum("dimension").notNull(),
  title: text("title").notNull(),
  prompt: text("prompt").notNull(),
  active: boolean("active").notNull().default(true),
  legacyKey: text("legacy_key"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const questionTags = pgTable(
  "question_tags",
  {
    questionId: uuid("question_id")
      .notNull()
      .references(() => questions.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.questionId, t.tagId] })],
);

export const clients = pgTable("clients", {
  id: uuid("id").defaultRandom().primaryKey(),
  therapistId: uuid("therapist_id")
    .notNull()
    .references(() => therapists.id, { onDelete: "cascade" }),
  pseudonym: text("pseudonym").notNull(),
  relationshipType: relationshipTypeEnum("relationship_type").notNull(),
  linkedClientId: uuid("linked_client_id"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const clientTags = pgTable(
  "client_tags",
  {
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.clientId, t.tagId] })],
);

export const assessments = pgTable("assessments", {
  id: uuid("id").defaultRandom().primaryKey(),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  status: assessmentStatusEnum("status").notNull().default("cards"),
  cardOrder: jsonb("card_order").$type<string[]>().notNull().default([]),
  answers: jsonb("answers").$type<Record<string, string>>().notNull().default({}),
  scores: jsonb("scores")
    .$type<Record<string, { score: number }>>()
    .notNull()
    .default({}),
  house: jsonb("house").$type<Record<string, number>>().default({}),
  neglected: jsonb("neglected").$type<string[]>().notNull().default([]),
  appreciated: jsonb("appreciated").$type<string[]>().notNull().default([]),
  hopes: jsonb("hopes").$type<string[]>().notNull().default([]),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const shareLinks = pgTable(
  "share_links",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    assessmentId: uuid("assessment_id")
      .notNull()
      .references(() => assessments.id, { onDelete: "cascade" }),
    token: text("token").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
  },
  (t) => [uniqueIndex("share_links_token").on(t.token)],
);
