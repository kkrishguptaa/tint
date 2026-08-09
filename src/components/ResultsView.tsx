"use client";

import { useState } from "react";
import type { Report } from "@/lib/types";
import { ScaleCompare } from "./ScaleCompare";
import { VennDiagram } from "./VennDiagram";

type Props = {
  report: Report;
  shareEnabled?: boolean;
};

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
