"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ScaleCompare } from "@/components/ScaleCompare";
import { VennDiagram } from "@/components/VennDiagram";
import { DIMENSION_LABELS, getCards } from "@/lib/content";
import { buildDimensionVenn } from "@/lib/dimension-venn";
import { buildVenn } from "@/lib/venn";
import {
  DIMENSION_IDS,
  HOUSE_FLOOR_LABELS,
  type Answers,
  type DimensionId,
  type DimensionScore,
  type HouseFloor,
} from "@/lib/types";

type Bundle = {
  client: { id: string; pseudonym: string };
  assessment: {
    answers: Answers;
    scores: Record<string, { score: number }>;
    house: Record<string, number>;
    neglected: string[];
    appreciated: string[];
    hopes: string[];
    remarks: string;
    status: string;
  };
};

const FLOORS: HouseFloor[] = [4, 3, 2, 1];

export default function CoupleConclusionPage() {
  const { aId } = useParams<{ aId: string }>();
  const router = useRouter();
  const [username, setUsername] = useState<string>();
  const [left, setLeft] = useState<Bundle | null>(null);
  const [right, setRight] = useState<Bundle | null>(null);
  const cards = useMemo(() => getCards(), []);

  useEffect(() => {
    async function load() {
      const me = await fetch("/api/auth/me").then((r) => r.json());
      if (!me.isLoggedIn) {
        router.replace("/login");
        return;
      }
      setUsername(me.username);
      const detail = await fetch(`/api/clients/${aId}`).then((r) => r.json());
      if (!detail.client?.linkedClientId) {
        router.replace(`/clients/${aId}`);
        return;
      }
      const bId = detail.client.linkedClientId as string;
      const [aAssess, bDetail, bAssess] = await Promise.all([
        fetch(`/api/clients/${aId}/assessment`).then((r) => r.json()),
        fetch(`/api/clients/${bId}`).then((r) => r.json()),
        fetch(`/api/clients/${bId}/assessment`).then((r) => r.json()),
      ]);
      if (
        aAssess.assessment.status !== "complete" ||
        bAssess.assessment.status !== "complete"
      ) {
        router.replace(`/clients/${aId}`);
        return;
      }
      setLeft({ client: detail.client, assessment: aAssess.assessment });
      setRight({ client: bDetail.client, assessment: bAssess.assessment });
    }
    void load();
  }, [aId, router]);

  if (!left || !right) {
    return (
      <AppShell username={username}>
        <p className="text-[var(--ink-muted)]">Loading conclusion…</p>
      </AppShell>
    );
  }

  const nameA = left.client.pseudonym;
  const nameB = right.client.pseudonym;
  const scoresA = left.assessment.scores as Record<DimensionId, DimensionScore>;
  const scoresB = right.assessment.scores as Record<DimensionId, DimensionScore>;
  const typeVenn = buildDimensionVenn(left.assessment.scores, right.assessment.scores);
  const typeTitles = Object.fromEntries(
    DIMENSION_IDS.map((d) => [d, DIMENSION_LABELS[d]]),
  );
  const cardVenn = buildVenn(
    cards,
    left.assessment.answers,
    right.assessment.answers,
  );

  return (
    <AppShell username={username}>
      <p className="text-sm text-[var(--ink-muted)]">
        <Link href={`/clients/${aId}`}>← Back</Link>
      </p>
      <h1 className="mt-2 text-4xl">
        Conclusion · {nameA} & {nameB}
      </h1>

      <div className="mt-10">
        <VennDiagram
          partnerAName={nameA}
          partnerBName={nameB}
          venn={typeVenn}
          cardTitles={typeTitles}
        />
        <p className="mt-2 text-sm text-[var(--ink-muted)]">
          Intimacy-type overlap (score ≥ 50). Strong common when both ≥ 67.
        </p>
      </div>

      <div className="mt-12">
        <ScaleCompare
          partnerAName={nameA}
          partnerBName={nameB}
          scoresA={scoresA}
          scoresB={scoresB}
        />
      </div>

      <section className="mt-12 space-y-4">
        <h2 className="text-2xl">Houses side by side</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {(
            [
              [nameA, left.assessment.house],
              [nameB, right.assessment.house],
            ] as const
          ).map(([name, house]) => (
            <div
              key={name}
              className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4"
            >
              <h3 className="mb-3 text-lg">{name}</h3>
              {FLOORS.map((floor) => {
                const dims = DIMENSION_IDS.filter(
                  (d) => (house as Record<string, number>)[d] === floor,
                );
                return (
                  <div key={floor} className="mb-2 text-sm">
                    <p className="text-xs uppercase text-[var(--ink-muted)]">
                      Floor {floor} · {HOUSE_FLOOR_LABELS[floor]}
                    </p>
                    <p>
                      {dims.length
                        ? dims.map((d) => DIMENSION_LABELS[d]).join(", ")
                        : "—"}
                    </p>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-2xl">Appreciated · Neglected · Hopes</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {(
            [
              [nameA, left.assessment],
              [nameB, right.assessment],
            ] as const
          ).map(([name, a]) => (
            <div
              key={name}
              className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4"
            >
              <h3 className="text-lg">{name}</h3>
              {(
                [
                  ["Appreciated", a.appreciated],
                  ["Neglected", a.neglected],
                  ["Hopes", a.hopes],
                ] as const
              ).map(([label, list]) => (
                <div key={label}>
                  <p className="text-xs uppercase text-[var(--ink-muted)]">{label}</p>
                  <p className="text-sm">
                    {list.length
                      ? list
                          .map((d) => DIMENSION_LABELS[d as DimensionId] ?? d)
                          .join(", ")
                      : "—"}
                  </p>
                </div>
              ))}
              <div>
                <p className="text-xs uppercase text-[var(--ink-muted)]">Remarks</p>
                <p className="whitespace-pre-wrap text-sm">{a.remarks || "—"}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12 space-y-8">
        <h2 className="text-2xl">Prompt Venns by intimacy type</h2>
        {DIMENSION_IDS.map((dim) => {
          const dimCards = cards.filter((c) => c.dimension === dim);
          const venn = buildVenn(
            dimCards,
            left.assessment.answers,
            right.assessment.answers,
          );
          const titles = Object.fromEntries(
            dimCards.map((c) => [c.id, c.title]),
          );
          return (
            <div key={dim} className="rounded-2xl border border-[var(--border)] p-4">
              <h3 className="mb-4 text-xl">{DIMENSION_LABELS[dim]}</h3>
              <VennDiagram
                partnerAName={nameA}
                partnerBName={nameB}
                venn={venn}
                cardTitles={titles}
              />
            </div>
          );
        })}
      </section>

      <p className="mt-8 text-sm text-[var(--ink-muted)]">
        Overall card overlap: {cardVenn.strongCommon.length} strong common,{" "}
        {cardVenn.common.length} common.
      </p>
    </AppShell>
  );
}
