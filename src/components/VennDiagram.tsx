import type { Report } from "@/lib/types";

type Props = {
  partnerAName: string;
  partnerBName: string;
  venn: Report["venn"];
  cardTitles: Record<string, string>;
};

export function VennDiagram({
  partnerAName,
  partnerBName,
  venn,
  cardTitles,
}: Props) {
  const shared = [
    ...venn.strongCommon.map((id) => ({ id, strong: true as const })),
    ...venn.common.map((id) => ({ id, strong: false as const })),
  ];

  return (
    <section className="space-y-5">
      <header className="space-y-2">
        <h2 className="text-2xl">Overlap</h2>
        <p className="text-[var(--ink-muted)]">
          Shared items are likes you both have. “Love” marks where you both
          swiped up.
        </p>
      </header>

      <div className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-6">
        <svg
          viewBox="0 0 360 220"
          className="mx-auto block h-auto w-full max-w-md"
          role="img"
          aria-label={`Venn diagram for ${partnerAName} and ${partnerBName}`}
        >
          <circle
            cx="130"
            cy="110"
            r="88"
            fill="var(--partner-a-soft)"
            stroke="var(--partner-a)"
            strokeWidth="2.5"
          />
          <circle
            cx="230"
            cy="110"
            r="88"
            fill="var(--partner-b-soft)"
            stroke="var(--partner-b)"
            strokeWidth="2.5"
          />
          <text
            x="88"
            y="36"
            textAnchor="middle"
            fill="var(--partner-a)"
            fontSize="13"
            fontFamily="Georgia, serif"
          >
            {partnerAName}
          </text>
          <text
            x="272"
            y="36"
            textAnchor="middle"
            fill="var(--partner-b)"
            fontSize="13"
            fontFamily="Georgia, serif"
          >
            {partnerBName}
          </text>
          <text
            x="180"
            y="114"
            textAnchor="middle"
            fill="var(--ink)"
            fontSize="12"
            fontFamily="Georgia, serif"
            opacity="0.85"
          >
            Shared
          </text>
          <text
            x="88"
            y="118"
            textAnchor="middle"
            fill="var(--ink)"
            fontSize="18"
            fontFamily="Georgia, serif"
          >
            {venn.aOnly.length}
          </text>
          <text
            x="180"
            y="138"
            textAnchor="middle"
            fill="var(--ink)"
            fontSize="18"
            fontFamily="Georgia, serif"
          >
            {shared.length}
          </text>
          <text
            x="272"
            y="118"
            textAnchor="middle"
            fill="var(--ink)"
            fontSize="18"
            fontFamily="Georgia, serif"
          >
            {venn.bOnly.length}
          </text>
        </svg>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <h3 className="text-sm tracking-wide uppercase text-[var(--partner-a)]">
            Only {partnerAName}
          </h3>
          <ul className="mt-2 space-y-1.5 text-sm">
            {venn.aOnly.length === 0 ? (
              <li className="text-[var(--ink-muted)]">None this round</li>
            ) : (
              venn.aOnly.map((id) => (
                <li key={id}>{cardTitles[id] ?? id}</li>
              ))
            )}
          </ul>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <h3 className="text-sm tracking-wide uppercase text-[var(--accent-text)]">
            Shared
          </h3>
          {shared.length === 0 ? (
            <p className="mt-2 text-sm text-[var(--ink-muted)]">None this round</p>
          ) : (
            <ul className="mt-2 space-y-1.5 text-sm">
              {shared.map((item) => (
                <li key={item.id} className="flex flex-wrap items-center gap-2">
                  <span>{cardTitles[item.id] ?? item.id}</span>
                  {item.strong && (
                    <span className="rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase text-[var(--accent-text)]">
                      Love
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <h3 className="text-sm tracking-wide uppercase text-[var(--partner-b)]">
            Only {partnerBName}
          </h3>
          <ul className="mt-2 space-y-1.5 text-sm">
            {venn.bOnly.length === 0 ? (
              <li className="text-[var(--ink-muted)]">None this round</li>
            ) : (
              venn.bOnly.map((id) => (
                <li key={id}>{cardTitles[id] ?? id}</li>
              ))
            )}
          </ul>
        </div>
      </div>
    </section>
  );
}
