"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";

type ClientOption = { id: string; pseudonym: string };

export default function NewClientPage() {
  const router = useRouter();
  const [username, setUsername] = useState<string>();
  const [pseudonym, setPseudonym] = useState("");
  const [relationshipType, setRelationshipType] = useState<"cis_het" | "queer" | "trans">("cis_het");
  const [linkedClientId, setLinkedClientId] = useState("");
  const [options, setOptions] = useState<ClientOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    async function load() {
      const me = await fetch("/api/auth/me").then((r) => r.json());
      if (!me.isLoggedIn) {
        router.replace("/login");
        return;
      }
      setUsername(me.username);
      const data = await fetch("/api/clients").then((r) => r.json());
      setOptions(
        (data.clients as { id: string; pseudonym: string }[]).map((c) => ({
          id: c.id,
          pseudonym: c.pseudonym,
        })),
      );
    }
    void load();
  }, [router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pseudonym,
        relationshipType,
        linkedClientId: linkedClientId || null,
      }),
    });
    setPending(false);
    if (!res.ok) {
      setError("Could not create client");
      return;
    }
    const data = await res.json();
    router.push(`/clients/${data.client.id}`);
  }

  return (
    <AppShell username={username}>
      <h1 className="text-4xl">New client</h1>
      <form onSubmit={onSubmit} className="mt-8 max-w-lg space-y-4">
        <label className="block space-y-2 text-sm">
          <span>Pseudonym</span>
          <input
            required
            value={pseudonym}
            onChange={(e) => setPseudonym(e.target.value)}
            className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3"
          />
        </label>
        <label className="block space-y-2 text-sm">
          <span>Type of relationship</span>
          <select
            value={relationshipType}
            onChange={(e) =>
              setRelationshipType(e.target.value as "cis_het" | "queer" | "trans")
            }
            className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3"
          >
            <option value="cis_het">Cis-het</option>
            <option value="queer">Queer</option>
            <option value="trans">Trans</option>
          </select>
        </label>
        <label className="block space-y-2 text-sm">
          <span>Link to existing client (optional)</span>
          <select
            value={linkedClientId}
            onChange={(e) => setLinkedClientId(e.target.value)}
            className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3"
          >
            <option value="">None</option>
            {options.map((o) => (
              <option key={o.id} value={o.id}>
                {o.pseudonym}
              </option>
            ))}
          </select>
        </label>
        {error && <p className="text-sm text-[var(--accent-text)]">{error}</p>}
        <button type="submit" disabled={pending} className="rounded-full btn-primary px-6 py-3">
          {pending ? "Creating…" : "Create client"}
        </button>
      </form>
    </AppShell>
  );
}
