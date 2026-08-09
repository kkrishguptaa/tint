import { DIMENSION_LABELS } from "@/lib/content";
import type { DimensionId, DimensionScore } from "@/lib/types";
import { DIMENSION_IDS } from "@/lib/types";

type Props = {
  partnerAName: string;
  partnerBName: string;
  scoresA: Record<DimensionId, DimensionScore>;
  scoresB: Record<DimensionId, DimensionScore>;
};

export function ScaleCompare({
  partnerAName,
  partnerBName,
  scoresA,
  scoresB,
}: Props) {
  return (
    <section className="space-y-6">
      <header className="flex items-end justify-between gap-4">
        <h2 className="text-2xl">Where you land</h2>
        <p className="text-sm text-[var(--ink-muted)]">
          <span className="text-[var(--partner-a)]">{partnerAName}</span>
          {" · "}
          <span className="text-[var(--partner-b)]">{partnerBName}</span>
        </p>
      </header>
      <ul className="space-y-5">
        {DIMENSION_IDS.map((id) => (
          <li key={id}>
            <div className="mb-2 flex justify-between text-sm">
              <span>{DIMENSION_LABELS[id]}</span>
              <span className="text-[var(--ink-muted)]">
                {scoresA[id].score} / {scoresB[id].score}
              </span>
            </div>
            <div className="relative h-3 rounded-full bg-[var(--surface)] ring-1 ring-[var(--border)]">
              <span
                className="absolute top-1/2 size-3.5 -translate-y-1/2 rounded-full bg-[var(--partner-a)] ring-2 ring-[var(--warm-white)]"
                style={{ left: `calc(${scoresA[id].score}% - 7px)` }}
                title={`${partnerAName}: ${scoresA[id].score}`}
              />
              <span
                className="absolute top-1/2 size-3.5 -translate-y-1/2 rounded-full bg-[var(--partner-b)] ring-2 ring-[var(--warm-white)]"
                style={{ left: `calc(${scoresB[id].score}% - 7px)` }}
                title={`${partnerBName}: ${scoresB[id].score}`}
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
