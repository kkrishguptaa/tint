import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createSession, getSession } from "./session-store";
import type { Report } from "./types";
import { DIMENSION_IDS } from "./types";

const score = { score: 50 };

function sampleReport(): Report {
  const scores = Object.fromEntries(
    DIMENSION_IDS.map((id) => [id, score]),
  ) as Report["scoresA"];
  const house = Object.fromEntries(
    DIMENSION_IDS.map((id) => [id, 1 as const]),
  ) as Report["houseA"];
  return {
    version: 1,
    createdAt: new Date().toISOString(),
    partnerAName: "A",
    partnerBName: "B",
    scoresA: scores,
    scoresB: scores,
    houseA: house,
    houseB: house,
    notesA: "",
    notesB: "",
    venn: { strongCommon: [], common: [], aOnly: [], bOnly: [] },
    cardTitles: {},
  };
}

describe("session-store", () => {
  let baseDir: string;

  afterEach(async () => {
    if (baseDir) await rm(baseDir, { recursive: true, force: true });
  });

  it("round-trips a report before expiry", async () => {
    baseDir = await mkdtemp(path.join(tmpdir(), "tint-sessions-"));
    const { id, expiresAt } = await createSession(sampleReport(), { baseDir });
    expect(expiresAt).toBeTruthy();
    const report = await getSession(id, { baseDir });
    expect(report?.partnerAName).toBe("A");
  });

  it("returns null when expired", async () => {
    baseDir = await mkdtemp(path.join(tmpdir(), "tint-sessions-"));
    const now = new Date("2020-01-01T00:00:00.000Z");
    const { id } = await createSession(sampleReport(), { baseDir, now });
    const later = new Date("2020-01-10T00:00:00.000Z");
    expect(await getSession(id, { baseDir, now: later })).toBeNull();
  });
});
