import { config } from "dotenv";
import { eq } from "drizzle-orm";
import cardsJson from "../data/cards.json";
import { getDb } from "../src/db";
import { questions, therapists } from "../src/db/schema";
import { DIMENSION_IDS, type DimensionId } from "../src/lib/types";

config({ path: ".env.local" });

async function main() {
  const db = getDb();
  const [therapist] = await db
    .select()
    .from(therapists)
    .where(eq(therapists.username, "utkarsha"))
    .limit(1);

  if (!therapist) {
    throw new Error("Therapist utkarsha not found — run npm run db:seed first");
  }

  const existing = await db
    .select({ legacyKey: questions.legacyKey })
    .from(questions)
    .where(eq(questions.therapistId, therapist.id));
  const have = new Set(
    existing.map((r) => r.legacyKey).filter((k): k is string => Boolean(k)),
  );

  const toInsert = cardsJson
    .filter((card) => {
      if (!DIMENSION_IDS.includes(card.dimension as DimensionId)) return false;
      return !have.has(card.id);
    })
    .map((card) => ({
      therapistId: therapist.id,
      dimension: card.dimension as DimensionId,
      title: card.title,
      prompt: card.prompt,
      active: true,
      legacyKey: card.id,
    }));

  if (toInsert.length === 0) {
    console.log("Seeded questions: nothing to insert");
    return;
  }

  // Batch insert
  const chunk = 50;
  for (let i = 0; i < toInsert.length; i += chunk) {
    await db.insert(questions).values(toInsert.slice(i, i + chunk));
  }

  console.log(
    `Seeded questions: inserted=${toInsert.length}, skipped=${have.size}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
