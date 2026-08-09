"use client";

import { useState } from "react";

type Props = {
  partnerName: string;
  initial?: string;
  onContinue: (notes: string) => void;
};

export function TherapistNotes({
  partnerName,
  initial = "",
  onContinue,
}: Props) {
  const [notes, setNotes] = useState(initial);

  return (
    <section className="space-y-6 py-6">
      <header className="space-y-2">
        <p className="text-sm tracking-[0.2em] uppercase text-[var(--ink-muted)]">
          Therapist reflections
        </p>
        <h1 className="text-4xl leading-tight">Notes on {partnerName}</h1>
        <p className="text-[var(--ink-muted)]">
          Private session notes for this partner. They&apos;ll be saved with the
          shared report.
        </p>
      </header>

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={10}
        placeholder="What stood out in scales, the house, or the conversation…"
        className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 outline-none focus:border-[var(--accent)]"
      />

      <button
        type="button"
        onClick={() => onContinue(notes)}
        className="rounded-full btn-primary px-6 py-3"
      >
        Save notes & continue
      </button>
    </section>
  );
}
