"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Option = { id: string; pseudonym: string };

export function ClientHubActions({
  clientId,
  needsLink,
  linkOptions,
}: {
  clientId: string;
  needsLink: boolean;
  linkOptions: Option[];
}) {
  const router = useRouter();
  const [linkExistingId, setLinkExistingId] = useState("");
  const [newPartnerName, setNewPartnerName] = useState("");
  const [newPartnerRel, setNewPartnerRel] = useState<"cis_het" | "queer" | "trans">(
    "cis_het",
  );
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function linkExisting() {
    if (!linkExistingId || busy) return;
    setBusy(true);
    setMessage(null);
    const res = await fetch(`/api/clients/${clientId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ linkedClientId: linkExistingId }),
    });
    setBusy(false);
    if (!res.ok) {
      setMessage("Could not link");
      return;
    }
    router.refresh();
  }

  async function createAndLink() {
    if (!newPartnerName.trim() || busy) return;
    setBusy(true);
    setMessage(null);
    const res = await fetch(`/api/clients/${clientId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        createLinked: {
          pseudonym: newPartnerName,
          relationshipType: newPartnerRel,
        },
      }),
    });
    if (!res.ok) {
      setBusy(false);
      setMessage("Could not create partner");
      return;
    }
    const data = await res.json();
    router.push(`/clients/${data.linked.id}`);
  }

  if (!needsLink) {
    return message ? (
      <p className="mt-4 text-sm text-[var(--accent-text)]">{message}</p>
    ) : null;
  }

  return (
    <section className="mt-10 space-y-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
      <h2 className="text-2xl">Link a partner</h2>
      <p className="text-[var(--ink-muted)]">
        This client has finished. Link an existing client or create a new one to
        continue.
      </p>

      <div className="space-y-3">
        <h3 className="text-sm uppercase tracking-wide text-[var(--ink-muted)]">
          Link existing
        </h3>
        <div className="flex flex-wrap gap-2">
          <select
            value={linkExistingId}
            onChange={(e) => setLinkExistingId(e.target.value)}
            className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] px-4 py-2"
          >
            <option value="">Select…</option>
            {linkOptions.map((o) => (
              <option key={o.id} value={o.id}>
                {o.pseudonym}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={busy}
            onClick={linkExisting}
            className="rounded-full btn-primary px-4 py-2 text-sm disabled:opacity-50"
          >
            Link
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm uppercase tracking-wide text-[var(--ink-muted)]">
          Create &amp; link
        </h3>
        <input
          value={newPartnerName}
          onChange={(e) => setNewPartnerName(e.target.value)}
          placeholder="Partner pseudonym"
          className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--bg)] px-4 py-2"
        />
        <select
          value={newPartnerRel}
          onChange={(e) =>
            setNewPartnerRel(e.target.value as "cis_het" | "queer" | "trans")
          }
          className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] px-4 py-2"
        >
          <option value="cis_het">Cis-het</option>
          <option value="queer">Queer</option>
          <option value="trans">Trans</option>
        </select>
        <button
          type="button"
          disabled={busy}
          onClick={createAndLink}
          className="block rounded-full btn-primary px-4 py-2 text-sm disabled:opacity-50"
        >
          Create &amp; open partner
        </button>
      </div>

      {message && <p className="text-sm text-[var(--accent-text)]">{message}</p>}
    </section>
  );
}
