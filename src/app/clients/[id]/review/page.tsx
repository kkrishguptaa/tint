"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SwipeMap } from "@/components/SwipeMap";
import type { Answers, Card } from "@/lib/types";

export default function ReviewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [name, setName] = useState("Client");
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
      if (a.assessment.status !== "review") {
        router.replace(`/clients/${id}`);
        return;
      }
      setCards((a.cards as Card[]) || []);
      setAnswers((a.assessment.answers as Answers) || {});
      setReady(true);
    }
    void load();
  }, [id, router]);

  async function continueToHouse() {
    setPending(true);
    const res = await fetch(`/api/clients/${id}/assessment`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "house" }),
    });
    setPending(false);
    if (res.ok) router.push(`/clients/${id}/house`);
  }

  if (!ready) {
    return (
      <main className="mx-auto max-w-3xl px-4 sm:px-6 py-16 text-[var(--ink-muted)]">
        Loading…
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-dvh max-w-3xl space-y-8 px-4 sm:px-6 py-8 sm:py-10">
      <header>
        <p className="text-sm uppercase tracking-wide text-[var(--ink-muted)]">
          Swipe review
        </p>
        <h1 className="mt-2 text-3xl sm:text-4xl">{name}</h1>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">
          Prompts grouped by intimacy type and swipe.
        </p>
      </header>

      <SwipeMap cards={cards} answers={answers} />

      <button
        type="button"
        disabled={pending}
        onClick={continueToHouse}
        className="rounded-full btn-primary px-6 py-3"
      >
        {pending ? "Continuing…" : "Continue to house"}
      </button>
    </main>
  );
}
