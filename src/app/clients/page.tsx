import Link from "next/link";
import { redirect } from "next/navigation";
import { desc, eq, inArray } from "drizzle-orm";
import { AppShell } from "@/components/AppShell";
import { getDb } from "@/db";
import { assessments, clients } from "@/db/schema";
import { requireTherapist } from "@/lib/auth";

const REL: Record<string, string> = {
  cis_het: "Cis-het",
  queer: "Queer",
  trans: "Trans",
};

export default async function ClientsPage() {
  const session = await requireTherapist();
  if (!session?.therapistId) redirect("/login");

  const db = getDb();
  const rows = await db
    .select()
    .from(clients)
    .where(eq(clients.therapistId, session.therapistId))
    .orderBy(desc(clients.createdAt));

  const ids = rows.map((c) => c.id);
  const assessmentRows =
    ids.length === 0
      ? []
      : await db
          .select()
          .from(assessments)
          .where(inArray(assessments.clientId, ids))
          .orderBy(desc(assessments.updatedAt));

  const latestByClient = new Map<string, string>();
  for (const a of assessmentRows) {
    if (!latestByClient.has(a.clientId)) {
      latestByClient.set(a.clientId, a.status);
    }
  }

  const nameById = new Map(rows.map((c) => [c.id, c.pseudonym]));

  return (
    <AppShell username={session.username}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl sm:text-4xl">Clients</h1>
          <p className="mt-2 text-sm sm:text-base text-[var(--ink-muted)]">
            Open a client to continue their assessment or view results.
          </p>
        </div>
        <Link
          href="/clients/new"
          className="self-start rounded-full btn-primary px-5 py-2.5 text-sm"
        >
          New client
        </Link>
      </div>

      {/* Mobile cards */}
      <ul className="mt-8 space-y-3 md:hidden">
        {rows.length === 0 ? (
          <li className="rounded-2xl border border-[var(--border)] p-6 text-[var(--ink-muted)]">
            No clients yet.
          </li>
        ) : (
          rows.map((c) => (
            <li
              key={c.id}
              className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4"
            >
              <Link
                href={`/clients/${c.id}`}
                className="text-lg text-[var(--accent-text)]"
              >
                {c.pseudonym}
              </Link>
              <p className="mt-1 text-sm text-[var(--ink-muted)]">
                {REL[c.relationshipType] ?? c.relationshipType}
                {" · "}
                {c.linkedClientId
                  ? `Linked: ${nameById.get(c.linkedClientId) ?? "yes"}`
                  : "Unlinked"}
                {" · "}
                <span className="capitalize">
                  {latestByClient.get(c.id) ?? "none"}
                </span>
              </p>
            </li>
          ))
        )}
      </ul>

      {/* Desktop table */}
      <div className="mt-8 hidden overflow-x-auto rounded-2xl border border-[var(--border)] md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--surface)] text-[var(--ink-muted)]">
            <tr>
              <th className="px-4 py-3 font-medium">Pseudonym</th>
              <th className="px-4 py-3 font-medium">Relationship</th>
              <th className="px-4 py-3 font-medium">Linked</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-[var(--ink-muted)]">
                  No clients yet.
                </td>
              </tr>
            ) : (
              rows.map((c) => (
                <tr key={c.id} className="border-t border-[var(--border)]">
                  <td className="px-4 py-3">
                    <Link
                      href={`/clients/${c.id}`}
                      className="text-[var(--accent-text)]"
                    >
                      {c.pseudonym}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    {REL[c.relationshipType] ?? c.relationshipType}
                  </td>
                  <td className="px-4 py-3">
                    {c.linkedClientId
                      ? (nameById.get(c.linkedClientId) ?? "Linked")
                      : "—"}
                  </td>
                  <td className="px-4 py-3 capitalize">
                    {latestByClient.get(c.id) ?? "none"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
