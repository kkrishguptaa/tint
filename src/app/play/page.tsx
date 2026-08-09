"use client";

import { useMemo, useState } from "react";
import { Handoff } from "@/components/Handoff";
import { ResultsView } from "@/components/ResultsView";
import { SwipeDeck } from "@/components/SwipeDeck";
import { getCards } from "@/lib/content";
import { buildReport } from "@/lib/report";
import type { Answers, Report, SwipeValue } from "@/lib/types";

type Phase = "nameA" | "swipeA" | "handoff" | "nameB" | "swipeB" | "results";

export default function PlayPage() {
  const cards = useMemo(() => getCards(), []);

  const [phase, setPhase] = useState<Phase>("nameA");
  const [nameA, setNameA] = useState("");
  const [nameB, setNameB] = useState("");
  const [answersA, setAnswersA] = useState<Answers>({});
  const [answersB, setAnswersB] = useState<Answers>({});
  const [historyA, setHistoryA] = useState<string[]>([]);
  const [historyB, setHistoryB] = useState<string[]>([]);
  const [report, setReport] = useState<Report | null>(null);

  const activeAnswers = phase === "swipeA" ? answersA : answersB;
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
      if (hist.length >= cards.length) setPhase("handoff");
      return;
    }
    if (phase === "swipeB") {
      const next = { ...answersB, [card.id]: value };
      const hist = [...historyB, card.id];
      setAnswersB(next);
      setHistoryB(hist);
      if (hist.length >= cards.length) {
        const built = buildReport({
          cards,
          partnerAName: nameA,
          partnerBName: nameB,
          answersA,
          answersB: next,
        });
        setReport(built);
        setPhase("results");
      }
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
              phase === "nameA" ? setNameA(e.target.value) : setNameB(e.target.value)
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

      {(phase === "swipeA" || phase === "swipeB") && card && (
        <SwipeDeck
          card={card}
          index={index}
          total={cards.length}
          canUndo={activeHistory.length > 0}
          onSwipe={applySwipe}
          onUndo={undo}
        />
      )}

      {phase === "handoff" && (
        <Handoff
          fromName={nameA.trim() || "Partner A"}
          onContinue={() => setPhase("nameB")}
        />
      )}

      {phase === "results" && report && (
        <ResultsView report={report} shareEnabled />
      )}
    </main>
  );
}
