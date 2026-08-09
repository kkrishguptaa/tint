import type { Report } from "@/lib/types";

type Props = {
  partnerAName: string;
  partnerBName: string;
  venn: Report["venn"];
  cardTitles: Record<string, string>;
};

function Bucket({
  title,
  ids,
  cardTitles,
  accent,
}: {
  title: string;
  ids: string[];
  cardTitles: Record<string, string>;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <h3 className="text-sm tracking-wide uppercase" style={{ color: accent }}>
        {title}
      </h3>
      {ids.length === 0 ? (
        <p className="mt-2 text-sm text-[var(--ink-muted)]">None this round</p>
      ) : (
        <ul className="mt-2 space-y-1 text-sm">
          {ids.map((id) => (
            <li key={id}>{cardTitles[id] ?? id}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function VennDiagram({
  partnerAName,
  partnerBName,
  venn,
  cardTitles,
}: Props) {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl">Overlap map</h2>
      <p className="text-[var(--ink-muted)]">
        Strong common means you both very-liked it. Common means you both at
        least liked it.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Bucket
          title="Strong common"
          ids={venn.strongCommon}
          cardTitles={cardTitles}
          accent="var(--love)"
        />
        <Bucket
          title="Common"
          ids={venn.common}
          cardTitles={cardTitles}
          accent="var(--like)"
        />
        <Bucket
          title={`Only ${partnerAName}`}
          ids={venn.aOnly}
          cardTitles={cardTitles}
          accent="var(--partner-a)"
        />
        <Bucket
          title={`Only ${partnerBName}`}
          ids={venn.bOnly}
          cardTitles={cardTitles}
          accent="var(--partner-b)"
        />
      </div>
    </section>
  );
}
