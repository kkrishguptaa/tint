import { NextResponse } from "next/server";
import { z } from "zod";
import { createSession } from "@/lib/session-store";
import { DIMENSION_IDS } from "@/lib/types";

const dimensionScoreSchema = z.object({
  score: z.number(),
  band: z.enum(["low", "mid", "high"]),
});

const scoresSchema = z.object(
  Object.fromEntries(
    DIMENSION_IDS.map((id) => [id, dimensionScoreSchema]),
  ) as Record<(typeof DIMENSION_IDS)[number], typeof dimensionScoreSchema>,
);

const reportSchema = z.object({
  version: z.literal(1),
  createdAt: z.string(),
  partnerAName: z.string(),
  partnerBName: z.string(),
  scoresA: scoresSchema,
  scoresB: scoresSchema,
  venn: z.object({
    strongCommon: z.array(z.string()),
    common: z.array(z.string()),
    aOnly: z.array(z.string()),
    bOnly: z.array(z.string()),
  }),
  cardTitles: z.record(z.string(), z.string()),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = reportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid report" }, { status: 400 });
  }

  const { id, expiresAt } = await createSession(parsed.data);
  return NextResponse.json(
    { id, expiresAt, url: `/r/${id}` },
    { status: 201 },
  );
}
