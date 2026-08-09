"use client";

import { useMemo, useState } from "react";
import { HouseBuilder } from "@/components/HouseBuilder";
import { PartnerConsolidatedResults } from "@/components/PartnerConsolidatedResults";
import { PartnerScaleResults } from "@/components/PartnerScaleResults";
import { PassDevice } from "@/components/PassDevice";
import { ResultsView } from "@/components/ResultsView";
import { SwipeDeck } from "@/components/SwipeDeck";
import { TherapistNotes } from "@/components/TherapistNotes";
import { getCards } from "@/lib/content";
import { buildReport } from "@/lib/report";
import { scoreAllDimensions } from "@/lib/scoring";
import type {
  Answers,
  DimensionId,
  HouseFloor,
  Report,
  SwipeValue,
} from "@/lib/types";

type Phase =
  | "nameA"
  | "swipeA"
  | "passTherapistA1"
  | "soloResultsA"
  | "houseA"
  | "passTherapistA2"
  | "consolidatedA"
  | "notesA"
  | "passPartnerB"
  | "nameB"
  | "swipeB"
  | "passTherapistB1"
  | "soloResultsB"
  | "houseB"
  | "passTherapistB2"
  | "consolidatedB"
  | "notesB"
  | "results";

export default function PlayPage() {
  const cards = useMemo(() => getCards(), []);

  const [phase, setPhase] = useState<Phase>("nameA");
  const [nameA, setNameA] = useState("");
  const [nameB, setNameB] = useState("");
  const [answersA, setAnswersA] = useState<Answers>({});
  const [answersB, setAnswersB] = useState<Answers>({});
  const [historyA, setHistoryA] = useState<string[]>([]);
  const [historyB, setHistoryB] = useState<string[]>([]);
  const [houseA, setHouseA] = useState<Record<DimensionId, HouseFloor> | null>(
    null,
  );
  const [houseB, setHouseB] = useState<Record<DimensionId, HouseFloor> | null>(
    null,
  );
  const [notesA, setNotesA] = useState("");
  const [notesB, setNotesB] = useState("");
  const [report, setReport] = useState<Report | null>(null);

  const displayA = nameA.trim() || "Partner A";
  const displayB = nameB.trim() || "Partner B";

  const scoresA = useMemo(
    () => scoreAllDimensions(cards, answersA),
    [cards, answersA],
  );
  const scoresB = useMemo(
    () => scoreAllDimensions(cards, answersB),
    [cards, answersB],
  );

  const swiping = phase === "swipeA" || phase === "swipeB";
  const activeHistory = phase === "swipeA" ? historyA : historyB;
  const index = activeHistory.length;
  const card = cards[index];

  function applySwipe(value: SwipeValue) {
    if (!card) return;
    if (phase === "swipeA") {
      const next = { ...answersA, [card.id]: value };
      const hist = [...historyA, card.id];
      setAnswersA(next);
      setHistoryA(hist);
      if (hist.length >= cards.length) setPhase("passTherapistA1");
      return;
    }
    if (phase === "swipeB") {
      const next = { ...answersB, [card.id]: value };
      const hist = [...historyB, card.id];
      setAnswersB(next);
      setHistoryB(hist);
      if (hist.length >= cards.length) setPhase("passTherapistB1");
    }
  }

  function undo() {
    if (phase === "swipeA" && historyA.length) {
      const hist = historyA.slice(0, -1);
      const last = historyA[historyA.length - 1];
      const next = { ...answersA };
      delete next[last];
      setHistoryA(hist);
      setAnswersA(next);
    }
    if (phase === "swipeB" && historyB.length) {
      const hist = historyB.slice(0, -1);
      const last = historyB[historyB.length - 1];
      const next = { ...answersB };
      delete next[last];
      setHistoryB(hist);
      setAnswersB(next);
    }
  }

  function finishCouple(finalNotesB: string) {
    if (!houseA || !houseB) return;
    const built = buildReport({
      cards,
      partnerAName: nameA,
      partnerBName: nameB,
      answersA,
      answersB,
      houseA,
      houseB,
      notesA,
      notesB: finalNotesB,
    });
    setNotesB(finalNotesB);
    setReport(built);
    setPhase("results");
  }

  return (
    <main className="mx-auto min-h-dvh max-w-lg px-6 py-10">
      {(phase === "nameA" || phase === "nameB") && (
        <section className="space-y-6 py-8">
          <p className="text-sm tracking-[0.2em] uppercase text-[var(--ink-muted)]">
            {phase === "nameA" ? "Partner one" : "Partner two"}
          </p>
          <h1 className="text-4xl">What should we call you?</h1>
          <input
            value={phase === "nameA" ? nameA : nameB}
            onChange={(e) =>
              phase === "nameA"
                ? setNameA(e.target.value)
                : setNameB(e.target.value)
            }
            placeholder="Optional name"
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-[var(--accent)]"
          />
          <button
            type="button"
            className="rounded-full bg-[var(--accent)] px-6 py-3 text-[#1a1410]"
            onClick={() => setPhase(phase === "nameA" ? "swipeA" : "swipeB")}
          >
            Start swiping
          </button>
        </section>
      )}

      {swiping && card && (
        <SwipeDeck
          card={card}
          index={index}
          total={cards.length}
          canUndo={activeHistory.length > 0}
          onSwipe={applySwipe}
          onUndo={undo}
        />
      )}

      {phase === "passTherapistA1" && (
        <PassDevice
          body="Hand the screen to the therapist for Partner one’s swipe results."
          continueLabel="I’m the therapist"
          onContinue={() => setPhase("soloResultsA")}
        />
      )}

      {phase === "soloResultsA" && (
        <PartnerScaleResults
          partnerName={displayA}
          scores={scoresA}
          onContinue={() => setPhase("houseA")}
        />
      )}

      {phase === "houseA" && (
        <HouseBuilder
          partnerName={displayA}
          onComplete={(house) => {
            setHouseA(house);
            setPhase("passTherapistA2");
          }}
        />
      )}

      {phase === "passTherapistA2" && (
        <PassDevice
          body="Hand the screen back to the therapist for the consolidated view."
          continueLabel="I’m the therapist"
          onContinue={() => setPhase("consolidatedA")}
        />
      )}

      {phase === "consolidatedA" && houseA && (
        <PartnerConsolidatedResults
          partnerName={displayA}
          scores={scoresA}
          house={houseA}
          onContinue={() => setPhase("notesA")}
        />
      )}

      {phase === "notesA" && (
        <TherapistNotes
          partnerName={displayA}
          initial={notesA}
          onContinue={(notes) => {
            setNotesA(notes);
            setPhase("passPartnerB");
          }}
        />
      )}

      {phase === "passPartnerB" && (
        <PassDevice
          title="Next partner"
          body={`${displayA} is done. Pass the device to the second partner.`}
          continueLabel="I’m the second partner"
          onContinue={() => setPhase("nameB")}
        />
      )}

      {phase === "passTherapistB1" && (
        <PassDevice
          body="Hand the screen to the therapist for Partner two’s swipe results."
          continueLabel="I’m the therapist"
          onContinue={() => setPhase("soloResultsB")}
        />
      )}

      {phase === "soloResultsB" && (
        <PartnerScaleResults
          partnerName={displayB}
          scores={scoresB}
          onContinue={() => setPhase("houseB")}
        />
      )}

      {phase === "houseB" && (
        <HouseBuilder
          partnerName={displayB}
          onComplete={(house) => {
            setHouseB(house);
            setPhase("passTherapistB2");
          }}
        />
      )}

      {phase === "passTherapistB2" && (
        <PassDevice
          body="Hand the screen back to the therapist for the consolidated view."
          continueLabel="I’m the therapist"
          onContinue={() => setPhase("consolidatedB")}
        />
      )}

      {phase === "consolidatedB" && houseB && (
        <PartnerConsolidatedResults
          partnerName={displayB}
          scores={scoresB}
          house={houseB}
          onContinue={() => setPhase("notesB")}
        />
      )}

      {phase === "notesB" && (
        <TherapistNotes
          partnerName={displayB}
          initial={notesB}
          onContinue={finishCouple}
        />
      )}

      {phase === "results" && report && (
        <ResultsView report={report} shareEnabled />
      )}
    </main>
  );
}
