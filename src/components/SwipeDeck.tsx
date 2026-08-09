"use client";

import { useEffect, useRef, useState } from "react";
import type { Card, SwipeValue } from "@/lib/types";
import { DIMENSION_LABELS } from "@/lib/content";

type Props = {
  card: Card;
  index: number;
  total: number;
  canUndo: boolean;
  onSwipe: (value: SwipeValue) => void;
  onUndo: () => void;
};

export function SwipeDeck({
  card,
  index,
  total,
  canUndo,
  onSwipe,
  onUndo,
}: Props) {
  const start = useRef<{ x: number; y: number } | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [hint, setHint] = useState<SwipeValue | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") onSwipe("dislike");
      if (e.key === "ArrowUp") onSwipe("like");
      if (e.key === "ArrowRight") onSwipe("love");
      if ((e.key === "z" || e.key === "Z") && (e.metaKey || e.ctrlKey) && canUndo) {
        e.preventDefault();
        onUndo();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [canUndo, onSwipe, onUndo]);

  function decide(dx: number, dy: number) {
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    if (absX < 60 && absY < 60) return null;
    if (absY > absX && dy < 0) return "like" as const;
    if (dx < 0) return "dislike" as const;
    return "love" as const;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between text-sm text-[var(--ink-muted)]">
        <span>
          {index + 1} / {total}
        </span>
        <span>{DIMENSION_LABELS[card.dimension]}</span>
      </div>

      <div
        className="relative touch-none select-none rounded-3xl border border-white/10 bg-[var(--bg-elevated)] p-8 shadow-2xl transition-transform"
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px) rotate(${offset.x / 40}deg)`,
        }}
        onPointerDown={(e) => {
          start.current = { x: e.clientX, y: e.clientY };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!start.current) return;
          const dx = e.clientX - start.current.x;
          const dy = e.clientY - start.current.y;
          setOffset({ x: dx, y: dy });
          setHint(decide(dx, dy));
        }}
        onPointerUp={() => {
          if (!start.current) return;
          const value = decide(offset.x, offset.y);
          start.current = null;
          setOffset({ x: 0, y: 0 });
          setHint(null);
          if (value) onSwipe(value);
        }}
      >
        {hint && (
          <p className="absolute top-4 left-1/2 -translate-x-1/2 text-xs tracking-[0.2em] uppercase text-[var(--accent-soft)]">
            {hint === "dislike" ? "Not for me" : hint === "like" ? "Like" : "Very like"}
          </p>
        )}
        <h2 className="mt-4 text-3xl text-[var(--ink)]">{card.title}</h2>
        <p className="mt-4 text-lg leading-relaxed text-[var(--ink-muted)]">
          {card.prompt}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center text-sm">
        <button
          type="button"
          className="rounded-2xl bg-white/5 px-3 py-3 text-[var(--dislike)]"
          onClick={() => onSwipe("dislike")}
        >
          ← Not
        </button>
        <button
          type="button"
          className="rounded-2xl bg-white/5 px-3 py-3 text-[var(--like)]"
          onClick={() => onSwipe("like")}
        >
          ↑ Like
        </button>
        <button
          type="button"
          className="rounded-2xl bg-white/5 px-3 py-3 text-[var(--love)]"
          onClick={() => onSwipe("love")}
        >
          Very →
        </button>
      </div>

      <button
        type="button"
        disabled={!canUndo}
        onClick={onUndo}
        className="text-sm text-[var(--ink-muted)] disabled:opacity-30"
      >
        Undo last swipe
      </button>
    </div>
  );
}
