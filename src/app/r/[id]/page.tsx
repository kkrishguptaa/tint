"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ResultsView } from "@/components/ResultsView";
import type { Report } from "@/lib/types";

export default function SharedReportPage() {
  const params = useParams<{ id: string }>();
  const [report, setReport] = useState<Report | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "gone">("loading");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const res = await fetch(`/api/sessions/${params.id}`);
      if (cancelled) return;
      if (!res.ok) {
        setStatus("gone");
        return;
      }
      setReport((await res.json()) as Report);
      setStatus("ready");
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  if (status === "loading") {
    return (
      <main className="mx-auto max-w-lg px-6 py-16 text-[var(--ink-muted)]">
        Loading report…
      </main>
    );
  }

  if (status === "gone" || !report) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-6 py-16">
        <h1 className="text-4xl">This session has ended</h1>
        <p className="mt-4 text-[var(--ink-muted)]">
          The share link expired or couldn&apos;t be found.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex w-fit rounded-full bg-[var(--accent)] px-6 py-3 text-[#1a1410]"
        >
          Start a new map
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-dvh max-w-lg px-6 py-10">
      <ResultsView report={report} />
    </main>
  );
}
