import { describe, expect, it } from "vitest";
import { isUuid, remapAnswers } from "./questions";
import type { Answers } from "./types";

describe("legacy question ids", () => {
  it("detects uuids", () => {
    expect(isUuid("5fab1b3a-0367-4855-a8db-ea74f55bd863")).toBe(true);
    expect(isUuid("conflict-staying-in-the-room")).toBe(false);
  });

  it("remaps answer keys through idMap", () => {
    const idMap = new Map([
      ["conflict-staying-in-the-room", "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee"],
    ]);
    const answers: Answers = {
      "conflict-staying-in-the-room": "like",
      "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee": "love",
    };
    expect(remapAnswers(answers, idMap)).toEqual({
      "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee": "love",
    });
  });
});
