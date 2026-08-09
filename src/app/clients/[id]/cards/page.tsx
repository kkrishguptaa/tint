"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { SwipeDeck } from "@/components/SwipeDeck";
import { getCards } from "@/lib/content";
import type { Answers, Card, SwipeValue } from "@/lib/types";

export default function CardsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const allCards = useMemo(() => getCards(), []);
  const [order, setOrder] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Answers>({});
  const [history, setHistory] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function load() {
      const me = await fetch("/api/auth/me").then((r) => r.json());
      if (!me.isLoggedIn) {
        router.replace("/login");
        return;
      }
      const res = await fetch(`/api/clients/${id}/assessment`);
      const data = await res.json();
      const assessment = data.assessment;
      if (assessment.status !== "cards") {
        router.replace(
          assessment.status === "complete"
            ? `/clients/${id}/summary`
            : `/clients/${id}/${assessment.status}`,
        );
        return;
      }
      setOrder(assessment.cardOrder as string[]);
      setAnswers((assessment.answers as Answers) || {});
      const answered = (assessment.cardOrder as string[]).filter(
        (cid: string) => assessment.answers?.[cid],
      );
      setHistory(answered);
      setReady(true);
    }
    void load();
  }, [id, router]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.ctrlKey && e.altKey && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        void skipRandom();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const cardsById = useMemo(() => {
    const map = new Map<string, Card>();
    for (const c of allCards) map.set(c.id, c);
    return map;
  }, [allCards]);

  const index = history.length;
  const card = order[index] ? cardsById.get(order[index]!) : undefined;

  async function persist(nextAnswers: Answers, fillRandom = false) {
    const res = await fetch(`/api/clients/${id}/assessment`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        fillRandom ? { fillRandom: true } : { answers: nextAnswers },
      ),
    });
    const data = await res.json();
    if (data.assessment?.status === "house") {
      router.push(`/clients/${id}/house`);
    }
  }

  async function skipRandom() {
    await persist({}, true);
  }

  function onSwipe(value: SwipeValue) {
    if (!card) return;
    const next = { ...answers, [card.id]: value };
    const hist = [...history, card.id];
    setAnswers(next);
    setHistory(hist);
    void persist(next);
  }

  function onUndo() {
    if (!history.length) return;
    const hist = history.slice(0, -1);
    const last = history[history.length - 1]!;
    const next = { ...answers };
    delete next[last];
    setHistory(hist);
    setAnswers(next);
    void persist(next);
  }

  if (!ready) {
    return (
      <main className="mx-auto max-w-lg px-6 py-16 text-[var(--ink-muted)]">
        Loading cards…
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-dvh max-w-lg px-6 py-10">
      <p className="mb-4 text-xs text-[var(--ink-muted)]">
        Therapist shortcut: Ctrl+Option+K fills remaining cards randomly.
      </p>
      {card ? (
        <SwipeDeck
          card={card}
          index={index}
          total={order.length}
          canUndo={history.length > 0}
          onSwipe={onSwipe}
          onUndo={onUndo}
        />
      ) : (
        <p className="text-[var(--ink-muted)]">Finishing…</p>
      )}
    </main>
  );
}
