"use client";

import { useMemo, useState } from "react";
import { DIMENSION_LABELS } from "@/lib/content";
import type { DimensionId, HouseFloor, HousePlacement } from "@/lib/types";
import { DIMENSION_IDS, HOUSE_FLOOR_LABELS } from "@/lib/types";

type Props = {
  partnerName: string;
  initial?: HousePlacement;
  onComplete: (house: Record<DimensionId, HouseFloor>) => void;
};

const FLOORS: HouseFloor[] = [4, 3, 2, 1];

export function HouseBuilder({ partnerName, initial = {}, onComplete }: Props) {
  const [placement, setPlacement] = useState<HousePlacement>(initial);
  const [selected, setSelected] = useState<DimensionId | null>(null);

  const unplaced = useMemo(
    () => DIMENSION_IDS.filter((id) => placement[id] === undefined),
    [placement],
  );

  const complete = unplaced.length === 0;

  function place(id: DimensionId, floor: HouseFloor) {
    setPlacement((prev) => ({ ...prev, [id]: floor }));
    setSelected(null);
  }

  function unplace(id: DimensionId) {
    setPlacement((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setSelected(id);
  }

  function onFloorActivate(floor: HouseFloor) {
    if (selected) place(selected, floor);
  }

  return (
    <section className="space-y-6 py-4">
      <header className="space-y-2">
        <p className="text-sm tracking-[0.2em] uppercase text-[var(--ink-muted)]">
          House of openness
        </p>
        <h1 className="text-3xl leading-tight">
          {partnerName}: place every intimacy
        </h1>
        <p className="text-[var(--ink-muted)]">
          Top floor = hardest to open about. Bottom = easiest. Select a
          dimension, then tap a floor — multiple per floor is fine.
        </p>
      </header>

      <div className="space-y-2">
        <p className="text-xs tracking-wide uppercase text-[var(--ink-muted)]">
          Still to place ({unplaced.length})
          {selected ? ` · selected: ${DIMENSION_LABELS[selected]}` : ""}
        </p>
        <div className="flex min-h-12 flex-wrap gap-2">
          {unplaced.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setSelected(id)}
              className={`rounded-full border px-3 py-1.5 text-sm ${
                selected === id
                  ? "border-[var(--accent)] bg-[var(--accent)]/20"
                  : "border-white/15 bg-white/10"
              }`}
            >
              {DIMENSION_LABELS[id]}
            </button>
          ))}
          {unplaced.length === 0 && (
            <span className="text-sm text-[var(--ink-muted)]">All placed</span>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-white/10">
        {FLOORS.map((floor, i) => {
          const onFloor = DIMENSION_IDS.filter((id) => placement[id] === floor);
          return (
            <button
              key={floor}
              type="button"
              onClick={() => onFloorActivate(floor)}
              className={`block w-full min-h-24 border-white/10 bg-white/[0.04] p-3 text-left ${
                i < FLOORS.length - 1 ? "border-b" : ""
              } ${selected ? "hover:bg-white/[0.07]" : ""}`}
            >
              <div className="mb-2 flex items-baseline justify-between gap-2">
                <span className="text-xs tracking-wide uppercase text-[var(--accent-soft)]">
                  Floor {floor}
                </span>
                <span className="text-xs text-[var(--ink-muted)]">
                  {HOUSE_FLOOR_LABELS[floor]}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {onFloor.length === 0 ? (
                  <span className="text-sm text-[var(--ink-muted)]">
                    {selected ? "Tap to place here" : "Empty"}
                  </span>
                ) : (
                  onFloor.map((id) => (
                    <span
                      key={id}
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        unplace(id);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.stopPropagation();
                          unplace(id);
                        }
                      }}
                      className="rounded-full bg-[var(--bg-elevated)] px-3 py-1.5 text-sm"
                    >
                      {DIMENSION_LABELS[id]}
                    </span>
                  ))
                )}
              </div>
            </button>
          );
        })}
      </div>

      <p className="text-sm text-[var(--ink-muted)]">
        Tip: tap a placed chip to return it to the tray.
      </p>

      <button
        type="button"
        disabled={!complete}
        onClick={() =>
          onComplete(placement as Record<DimensionId, HouseFloor>)
        }
        className="rounded-full bg-[var(--accent)] px-6 py-3 text-[#1a1410] disabled:opacity-40"
      >
        Finish house
      </button>
    </section>
  );
}
