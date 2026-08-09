import { config } from "dotenv";
import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { getDb } from "../src/db";
import { therapists } from "../src/db/schema";

config({ path: ".env.local" });

async function main() {
  const db = getDb();
  const username = "utkarsha";
  const password = "madeattnt";
  const passwordHash = await hash(password, 12);

  const existing = await db
    .select()
    .from(therapists)
    .where(eq(therapists.username, username))
    .limit(1);

  if (existing[0]) {
    await db
      .update(therapists)
      .set({ passwordHash })
      .where(eq(therapists.username, username));
    console.log(`Updated therapist password hash for ${username}`);
  } else {
    await db.insert(therapists).values({ username, passwordHash });
    console.log(`Created therapist ${username}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
