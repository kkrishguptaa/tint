"use client";

import { DIMENSION_LABELS } from "@/lib/content";
import type { DimensionId, DimensionScore } from "@/lib/types";
import { DIMENSION_IDS } from "@/lib/types";

type Props = {
  partnerName: string;
  scores: Record<DimensionId, DimensionScore>;
  onContinue: () => void;
};

export function PartnerScaleResults({
  partnerName,
  scores,
  onContinue,
}: Props) {
  return (
    <section className="space-y-8 py-6">
      <header className="space-y-2">
        <p className="text-sm tracking-[0.2em] uppercase text-[var(--ink-muted)]">
          Therapist view
        </p>
        <h1 className="text-4xl leading-tight">{partnerName}&apos;s scales</h1>
        <p className="text-[var(--ink-muted)]">
          Affinity + breadth scores from their swipe pass.
        </p>
      </header>

      <ul className="space-y-4">
        {DIMENSION_IDS.map((id) => (
          <li key={id}>
            <div className="mb-2 flex justify-between text-sm">
              <span>{DIMENSION_LABELS[id]}</span>
              <span className="text-[var(--ink-muted)]">{scores[id].score}</span>
            </div>
            <div className="relative h-3 rounded-full bg-white/10">
              <span
                className="absolute top-1/2 size-3 -translate-y-1/2 rounded-full bg-[var(--accent)]"
                style={{ left: `calc(${scores[id].score}% - 6px)` }}
              />
            </div>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={onContinue}
        className="rounded-full bg-[var(--accent)] px-6 py-3 text-[#1a1410]"
      >
        Continue to house activity
      </button>
    </section>
  );
}
