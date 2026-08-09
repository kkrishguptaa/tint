"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SwipeMap } from "@/components/SwipeMap";
import { DIMENSION_LABELS } from "@/lib/content";
import {
  DIMENSION_IDS,
  HOUSE_FLOOR_LABELS,
  type Answers,
  type Card,
  type DimensionId,
  type HouseFloor,
} from "@/lib/types";

const FLOORS: HouseFloor[] = [4, 3, 2, 1];

export default function OutcomePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [name, setName] = useState("Client");
  const [house, setHouse] = useState<Record<string, number>>({});
  const [cards, setCards] = useState<Card[]>([]);
  const [answers, setAnswers] = useState<Answers>({});
  const [ready, setReady] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    async function load() {
      const me = await fetch("/api/auth/me").then((r) => r.json());
      if (!me.isLoggedIn) {
        router.replace("/login");
        return;
      }
      const detail = await fetch(`/api/clients/${id}`).then((r) => r.json());
      setName(detail.client.pseudonym);
      const a = await fetch(`/api/clients/${id}/assessment`).then((r) => r.json());
      if (a.assessment.status !== "outcome") {
        router.replace(`/clients/${id}`);
        return;
      }
      setHouse((a.assessment.house as Record<string, number>) || {});
      setCards((a.cards as Card[]) || []);
      setAnswers((a.assessment.answers as Answers) || {});
      setReady(true);
    }
    void load();
  }, [id, router]);

  async function continueToTherapist() {
    setPending(true);
    const res = await fetch(`/api/clients/${id}/assessment`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "therapist" }),
    });
    setPending(false);
    if (res.ok) router.push(`/clients/${id}/therapist`);
  }

  if (!ready) {
    return (
      <main className="mx-auto max-w-3xl px-4 sm:px-6 py-16 text-[var(--ink-muted)]">
        Loading…
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-dvh max-w-3xl space-y-10 px-4 sm:px-6 py-8 sm:py-10">
      <header>
        <p className="text-sm uppercase tracking-wide text-[var(--ink-muted)]">
          House outcome
        </p>
        <h1 className="mt-2 text-3xl sm:text-4xl">{name}</h1>
      </header>

      <section className="space-y-3">
        <h2 className="text-2xl">Openness house</h2>
        {FLOORS.map((floor) => {
          const dims = DIMENSION_IDS.filter((d) => house[d] === floor);
          return (
            <div
              key={floor}
              className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3"
            >
              <p className="text-xs uppercase text-[var(--accent-text)]">
                Floor {floor} · {HOUSE_FLOOR_LABELS[floor]}
              </p>
              <p className="mt-1 text-sm">
                {dims.length
                  ? dims.map((d) => DIMENSION_LABELS[d as DimensionId]).join(", ")
                  : "—"}
              </p>
            </div>
          );
        })}
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl">Swipe map</h2>
        <SwipeMap cards={cards} answers={answers} />
      </section>

      <button
        type="button"
        disabled={pending}
        onClick={continueToTherapist}
        className="rounded-full btn-primary px-6 py-3"
      >
        {pending ? "Continuing…" : "Continue to therapist form"}
      </button>
    </main>
  );
}
