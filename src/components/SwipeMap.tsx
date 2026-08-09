"use client";

import { DIMENSION_LABELS } from "@/lib/content";
import {
  DIMENSION_IDS,
  type Answers,
  type Card,
  type DimensionId,
  type SwipeValue,
} from "@/lib/types";

const GROUPS: { value: SwipeValue; label: string; bubbleClass: string }[] = [
  {
    value: "dislike",
    label: "Dislike",
    bubbleClass:
      "bg-[color-mix(in_srgb,var(--dislike)_18%,var(--warm-white))] text-[var(--dislike)] ring-1 ring-[color-mix(in_srgb,var(--dislike)_35%,transparent)]",
  },
  {
    value: "like",
    label: "Like",
    bubbleClass:
      "bg-[color-mix(in_srgb,var(--like)_16%,var(--warm-white))] text-[var(--like)] ring-1 ring-[color-mix(in_srgb,var(--like)_35%,transparent)]",
  },
  {
    value: "love",
    label: "Love",
    bubbleClass:
      "bg-[color-mix(in_srgb,var(--love)_16%,var(--warm-white))] text-[var(--love)] ring-1 ring-[color-mix(in_srgb,var(--love)_35%,transparent)]",
  },
];

export function SwipeMap({
  cards,
  answers,
}: {
  cards: Card[];
  answers: Answers;
}) {
  return (
    <div className="space-y-8">
      {DIMENSION_IDS.map((dim) => {
        const dimCards = cards.filter((c) => c.dimension === dim);
        if (dimCards.length === 0) return null;
        const groups: Record<SwipeValue, string[]> = {
          dislike: [],
          like: [],
          love: [],
        };
        for (const card of dimCards) {
          const v = answers[card.id] as SwipeValue | undefined;
          if (v) groups[v].push(card.prompt);
        }
        return (
          <div key={dim} className="space-y-3">
            <h3 className="text-xl">{DIMENSION_LABELS[dim as DimensionId]}</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              {GROUPS.map(({ value, label, bubbleClass }) => (
                <div key={value} className="space-y-2">
                  <p className="text-xs uppercase tracking-wide text-[var(--ink-muted)]">
                    {label}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {groups[value].length === 0 ? (
                      <span className="text-sm text-[var(--ink-muted)]">—</span>
                    ) : (
                      groups[value].map((prompt) => (
                        <span
                          key={prompt}
                          className={`inline-block max-w-full rounded-full px-3 py-1.5 text-sm leading-snug ${bubbleClass}`}
                        >
                          {prompt}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
