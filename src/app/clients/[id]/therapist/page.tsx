"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DIMENSION_LABELS } from "@/lib/content";
import { DIMENSION_IDS, type DimensionId } from "@/lib/types";

function DimMultiSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: DimensionId[];
  onChange: (next: DimensionId[]) => void;
}) {
  function toggle(id: DimensionId) {
    onChange(
      value.includes(id) ? value.filter((d) => d !== id) : [...value, id],
    );
  }

  return (
    <fieldset className="space-y-3">
      <legend className="text-lg">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {DIMENSION_IDS.map((id) => {
          const on = value.includes(id);
          return (
            <button
              key={id}
              type="button"
              onClick={() => toggle(id)}
              className={`rounded-full border px-3 py-1.5 text-sm ${
                on
                  ? "border-[var(--espresso)] bg-[var(--espresso)] text-[var(--warm-white)]"
                  : "border-[var(--border)] bg-[var(--surface)]"
              }`}
            >
              {DIMENSION_LABELS[id]}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export default function TherapistFormPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [name, setName] = useState("Client");
  const [neglected, setNeglected] = useState<DimensionId[]>([]);
  const [appreciated, setAppreciated] = useState<DimensionId[]>([]);
  const [hopes, setHopes] = useState<DimensionId[]>([]);
  const [remarks, setRemarks] = useState("");
  const [ready, setReady] = useState(false);
  const [pending, setPending] = useState(false);

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
      if (a.assessment.status !== "therapist") {
        router.replace(`/clients/${id}`);
        return;
      }
      setNeglected((a.assessment.neglected as DimensionId[]) || []);
      setAppreciated((a.assessment.appreciated as DimensionId[]) || []);
      setHopes((a.assessment.hopes as DimensionId[]) || []);
      setRemarks(a.assessment.remarks || "");
      setReady(true);
    }
    void load();
  }, [id, router]);

  async function save() {
    setPending(true);
    const res = await fetch(`/api/clients/${id}/assessment`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        neglected,
        appreciated,
        hopes,
        remarks,
        status: "complete",
      }),
    });
    setPending(false);
    if (res.ok) router.push(`/clients/${id}/summary`);
  }

  if (!ready) {
    return (
      <main className="mx-auto max-w-lg px-6 py-16 text-[var(--ink-muted)]">
        Loading…
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-dvh max-w-2xl space-y-8 px-6 py-10">
      <header>
        <p className="text-sm uppercase tracking-wide text-[var(--ink-muted)]">
          Therapist form
        </p>
        <h1 className="mt-2 text-4xl">{name}</h1>
      </header>

      <DimMultiSelect
        label="What feels most neglected?"
        value={neglected}
        onChange={setNeglected}
      />
      <DimMultiSelect
        label="What feels most appreciated?"
        value={appreciated}
        onChange={setAppreciated}
      />
      <DimMultiSelect
        label="What do you hope to work towards?"
        value={hopes}
        onChange={setHopes}
      />

      <label className="block space-y-2">
        <span className="text-lg">Remarks</span>
        <textarea
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          rows={6}
          className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3"
          placeholder="Visible on the client summary when you share the screen"
        />
      </label>

      <button
        type="button"
        disabled={pending}
        onClick={save}
        className="rounded-full btn-primary px-6 py-3"
      >
        {pending ? "Saving…" : "Save & open summary"}
      </button>
    </main>
  );
}
