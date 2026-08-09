"use client";

import { useState } from "react";
import { DIMENSION_LABELS } from "@/lib/content";
import type { Report } from "@/lib/types";
import { DIMENSION_IDS, HOUSE_FLOOR_LABELS } from "@/lib/types";
import { ScaleCompare } from "./ScaleCompare";
import { VennDiagram } from "./VennDiagram";

type Props = {
  report: Report;
  shareEnabled?: boolean;
};

const FLOORS = [4, 3, 2, 1] as const;

export function ResultsView({ report, shareEnabled = false }: Props) {
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function save() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(report),
      });
      if (!res.ok) throw new Error("Could not save");
      const data = (await res.json()) as { url: string };
      setShareUrl(`${window.location.origin}${data.url}`);
    } catch {
      setError("Save failed. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-12 py-8">
      <header className="space-y-3">
        <p className="text-sm tracking-[0.2em] uppercase text-[var(--ink-muted)]">
          Your map
        </p>
        <h1 className="text-4xl leading-tight">
          {report.partnerAName} & {report.partnerBName}
        </h1>
      </header>

      <ScaleCompare
        partnerAName={report.partnerAName}
        partnerBName={report.partnerBName}
        scoresA={report.scoresA}
        scoresB={report.scoresB}
      />

      <VennDiagram
        partnerAName={report.partnerAName}
        partnerBName={report.partnerBName}
        venn={report.venn}
        cardTitles={report.cardTitles}
      />

      <section className="space-y-4">
        <h2 className="text-2xl">Openness houses</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {(
            [
              [report.partnerAName, report.houseA],
              [report.partnerBName, report.houseB],
            ] as const
          ).map(([name, house]) => (
            <div
              key={name}
              className="rounded-2xl border border-white/10 bg-white/5 p-4"
            >
              <h3 className="mb-3 text-lg">{name}</h3>
              <div className="space-y-2 text-sm">
                {FLOORS.map((floor) => {
                  const dims = DIMENSION_IDS.filter((id) => house[id] === floor);
                  return (
                    <div key={floor}>
                      <p className="text-xs uppercase text-[var(--ink-muted)]">
                        Floor {floor} · {HOUSE_FLOOR_LABELS[floor]}
                      </p>
                      <p>
                        {dims.length
                          ? dims.map((id) => DIMENSION_LABELS[id]).join(", ")
                          : "—"}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {(report.notesA || report.notesB) && (
        <section className="space-y-4">
          <h2 className="text-2xl">Therapist notes</h2>
          {report.notesA && (
            <article className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <h3 className="text-sm uppercase text-[var(--ink-muted)]">
                {report.partnerAName}
              </h3>
              <p className="mt-2 whitespace-pre-wrap">{report.notesA}</p>
            </article>
          )}
          {report.notesB && (
            <article className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <h3 className="text-sm uppercase text-[var(--ink-muted)]">
                {report.partnerBName}
              </h3>
              <p className="mt-2 whitespace-pre-wrap">{report.notesB}</p>
            </article>
          )}
        </section>
      )}

      {shareEnabled && (
        <section className="space-y-3 border-t border-white/10 pt-8">
          <h2 className="text-2xl">Save & share</h2>
          <p className="text-[var(--ink-muted)]">
            Creates a private link that expires in 7 days.
          </p>
          {!shareUrl ? (
            <button
              type="button"
              disabled={pending}
              onClick={save}
              className="rounded-full bg-[var(--accent)] px-6 py-3 text-[#1a1410] disabled:opacity-60"
            >
              {pending ? "Saving…" : "Create share link"}
            </button>
          ) : (
            <p className="break-all rounded-2xl bg-white/5 p-4 text-sm">
              {shareUrl}
            </p>
          )}
          {error && <p className="text-sm text-[var(--love)]">{error}</p>}
        </section>
      )}
    </div>
  );
}
