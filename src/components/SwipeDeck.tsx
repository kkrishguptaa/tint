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

const EXIT = 420;

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
  const [exiting, setExiting] = useState(false);
  const locked = useRef(false);

  useEffect(() => {
    locked.current = false;
    setExiting(false);
    setOffset({ x: 0, y: 0 });
    setHint(null);
    start.current = null;
  }, [card.id]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (locked.current) return;
      if (e.key === "ArrowLeft") commit("dislike");
      if (e.key === "ArrowUp") commit("like");
      if (e.key === "ArrowRight") commit("love");
      if ((e.key === "z" || e.key === "Z") && (e.metaKey || e.ctrlKey) && canUndo) {
        e.preventDefault();
        onUndo();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function decide(dx: number, dy: number): SwipeValue | null {
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    if (absX < 60 && absY < 60) return null;
    if (absY > absX && dy < 0) return "like";
    if (dx < 0) return "dislike";
    return "love";
  }

  function exitOffset(value: SwipeValue) {
    if (value === "dislike") return { x: -EXIT, y: 0 };
    if (value === "love") return { x: EXIT, y: 0 };
    return { x: 0, y: -EXIT };
  }

  function commit(value: SwipeValue) {
    if (locked.current) return;
    locked.current = true;
    setExiting(true);
    setHint(value);
    setOffset(exitOffset(value));
    window.setTimeout(() => {
      onSwipe(value);
    }, 220);
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
        className={`relative touch-none select-none rounded-3xl border border-white/10 bg-[var(--bg-elevated)] p-8 shadow-2xl ${
          exiting ? "transition-transform duration-200 ease-out" : "transition-transform duration-150 ease-out"
        }`}
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px) rotate(${offset.x / 40}deg)`,
        }}
        onPointerDown={(e) => {
          if (locked.current) return;
          start.current = { x: e.clientX, y: e.clientY };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!start.current || locked.current) return;
          const dx = e.clientX - start.current.x;
          const dy = e.clientY - start.current.y;
          setOffset({ x: dx, y: dy });
          setHint(decide(dx, dy));
        }}
        onPointerUp={() => {
          if (!start.current || locked.current) return;
          const value = decide(offset.x, offset.y);
          start.current = null;
          if (value) {
            commit(value);
            return;
          }
          setOffset({ x: 0, y: 0 });
          setHint(null);
        }}
        onPointerCancel={() => {
          if (locked.current) return;
          start.current = null;
          setOffset({ x: 0, y: 0 });
          setHint(null);
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
          disabled={exiting}
          className="rounded-2xl bg-white/5 px-3 py-3 text-[var(--dislike)] disabled:opacity-40"
          onClick={() => commit("dislike")}
        >
          ← Not
        </button>
        <button
          type="button"
          disabled={exiting}
          className="rounded-2xl bg-white/5 px-3 py-3 text-[var(--like)] disabled:opacity-40"
          onClick={() => commit("like")}
        >
          ↑ Like
        </button>
        <button
          type="button"
          disabled={exiting}
          className="rounded-2xl bg-white/5 px-3 py-3 text-[var(--love)] disabled:opacity-40"
          onClick={() => commit("love")}
        >
          Very →
        </button>
      </div>

      <button
        type="button"
        disabled={!canUndo || exiting}
        onClick={onUndo}
        className="text-sm text-[var(--ink-muted)] disabled:opacity-30"
      >
        Undo last swipe
      </button>
    </div>
  );
}
