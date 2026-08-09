"use client";

import { DIMENSION_LABELS } from "@/lib/content";
import type {
  DimensionId,
  DimensionScore,
  HouseFloor,
} from "@/lib/types";
import { DIMENSION_IDS, HOUSE_FLOOR_LABELS } from "@/lib/types";

type Props = {
  partnerName: string;
  scores: Record<DimensionId, DimensionScore>;
  house: Record<DimensionId, HouseFloor>;
  onContinue: () => void;
};

const FLOORS: HouseFloor[] = [4, 3, 2, 1];

export function PartnerConsolidatedResults({
  partnerName,
  scores,
  house,
  onContinue,
}: Props) {
  return (
    <section className="space-y-8 py-6">
      <header className="space-y-2">
        <p className="text-sm tracking-[0.2em] uppercase text-[var(--ink-muted)]">
          Therapist view · consolidated
        </p>
        <h1 className="text-4xl leading-tight">{partnerName}</h1>
        <p className="text-[var(--ink-muted)]">
          Swipe scales plus openness house for this partner.
        </p>
      </header>

      <div>
        <h2 className="mb-4 text-xl">Scales</h2>
        <ul className="space-y-3">
          {DIMENSION_IDS.map((id) => (
            <li
              key={id}
              className="flex items-center justify-between gap-3 text-sm"
            >
              <span>{DIMENSION_LABELS[id]}</span>
              <span className="text-[var(--ink-muted)]">{scores[id].score}</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h2 className="mb-4 text-xl">Openness house</h2>
        <div className="space-y-3">
          {FLOORS.map((floor) => {
            const dims = DIMENSION_IDS.filter((id) => house[id] === floor);
            return (
              <div
                key={floor}
                className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3"
              >
                <p className="text-xs tracking-wide uppercase text-[var(--accent-text)]">
                  Floor {floor} · {HOUSE_FLOOR_LABELS[floor]}
                </p>
                <p className="mt-2 text-sm">
                  {dims.length === 0
                    ? "—"
                    : dims.map((id) => DIMENSION_LABELS[id]).join(", ")}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={onContinue}
        className="rounded-full btn-primary px-6 py-3"
      >
        Continue to reflections
      </button>
    </section>
  );
}
