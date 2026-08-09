import { DIMENSION_LABELS } from "@/lib/content";
import type { DimensionId, DimensionScore } from "@/lib/types";
import { DIMENSION_IDS } from "@/lib/types";

type Props = {
  partnerAName: string;
  partnerBName: string;
  scoresA: Record<DimensionId, DimensionScore>;
  scoresB: Record<DimensionId, DimensionScore>;
};

function grade(score: number) {
  return (score / 10).toFixed(1);
}

export function ScaleCompare({
  partnerAName,
  partnerBName,
  scoresA,
  scoresB,
}: Props) {
  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="text-2xl">Intimacy grades /10</h2>
        <p className="text-sm text-[var(--ink-muted)]">
          <span className="text-[var(--partner-a)]">{partnerAName}</span>
          {" · "}
          <span className="text-[var(--partner-b)]">{partnerBName}</span>
        </p>
      </header>
      <ul className="space-y-5">
        {DIMENSION_IDS.map((id) => (
          <li key={id}>
            <div className="mb-2 flex justify-between gap-2 text-sm">
              <span>{DIMENSION_LABELS[id]}</span>
              <span className="shrink-0 text-[var(--ink-muted)]">
                {grade(scoresA[id].score)} / {grade(scoresB[id].score)}
              </span>
            </div>
            <div className="relative h-3 rounded-full bg-[var(--surface)] ring-1 ring-[var(--border)]">
              <span
                className="absolute top-1/2 size-3.5 -translate-y-1/2 rounded-full bg-[var(--partner-a)] ring-2 ring-[var(--warm-white)]"
                style={{ left: `calc(${scoresA[id].score}% - 7px)` }}
                title={`${partnerAName}: ${grade(scoresA[id].score)}`}
              />
              <span
                className="absolute top-1/2 size-3.5 -translate-y-1/2 rounded-full bg-[var(--partner-b)] ring-2 ring-[var(--warm-white)]"
                style={{ left: `calc(${scoresB[id].score}% - 7px)` }}
                title={`${partnerBName}: ${grade(scoresB[id].score)}`}
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
