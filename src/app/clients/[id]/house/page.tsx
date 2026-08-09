"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { HouseBuilder } from "@/components/HouseBuilder";
import type { DimensionId, HouseFloor } from "@/lib/types";

export default function HousePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [name, setName] = useState("Client");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function load() {
      const me = await fetch("/api/auth/me").then((r) => r.json());
      if (!me.isLoggedIn) {
        router.replace("/login");
        return;
      }
      const detail = await fetch(`/api/clients/${id}`).then((r) => r.json());
      setName(detail.client.pseudonym);
      const a = await fetch(`/api/clients/${id}/assessment`).then((r) => r.json());
      if (a.assessment.status !== "house") {
        router.replace(`/clients/${id}`);
        return;
      }
      setReady(true);
    }
    void load();
  }, [id, router]);

  async function onComplete(house: Record<DimensionId, HouseFloor>) {
    const res = await fetch(`/api/clients/${id}/assessment`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ house }),
    });
    if (res.ok) router.push(`/clients/${id}/therapist`);
  }

  if (!ready) {
    return (
      <main className="mx-auto max-w-lg px-6 py-16 text-[var(--ink-muted)]">
        Loading…
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-dvh max-w-lg px-6 py-10">
      <HouseBuilder partnerName={name} onComplete={onComplete} />
    </main>
  );
}
