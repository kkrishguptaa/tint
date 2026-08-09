"use client";

import Link from "next/link";
import { useState } from "react";

export default function HomePage() {
  const [consent, setConsent] = useState(false);

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-6 py-16">
      <p className="text-sm tracking-[0.35em] uppercase text-[var(--accent-soft)]">
        tint
      </p>
      <h1 className="mt-4 text-5xl leading-[1.05] tracking-tight">
        Map how you connect
      </h1>
      <p className="mt-5 text-lg leading-relaxed text-[var(--ink-muted)]">
        Two partners, one device. Swipe through ten intimacy dimensions, then
        see your scales, overlap, and what to try next.
      </p>

      <label className="mt-10 flex items-start gap-3 text-sm leading-relaxed text-[var(--ink-muted)]">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-1 size-4 accent-[var(--accent)]"
        />
        <span>
          We&apos;re both 18+ and okay discussing physical and sexual topics in
          this session.
        </span>
      </label>

      {consent ? (
        <Link
          href="/play"
          className="mt-8 inline-flex items-center justify-center rounded-full bg-[var(--accent)] px-6 py-3 text-center font-medium text-[#1a1410]"
        >
          Begin together
        </Link>
      ) : (
        <button
          type="button"
          disabled
          className="mt-8 rounded-full bg-white/10 px-6 py-3 text-[var(--ink-muted)]"
        >
          Begin together
        </button>
      )}
    </main>
  );
}
