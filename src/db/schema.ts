import {
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const relationshipTypeEnum = pgEnum("relationship_type", [
  "cis_het",
  "queer",
  "trans",
]);

export const assessmentStatusEnum = pgEnum("assessment_status", [
  "cards",
  "house",
  "therapist",
  "complete",
]);

export const therapists = pgTable("therapists", {
  id: uuid("id").defaultRandom().primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

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
  remarks: text("remarks").notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});
