import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { AppShell } from "@/components/AppShell";
import { ClientHubActions } from "@/components/ClientHubActions";
import { getDb } from "@/db";
import { assessments, clients } from "@/db/schema";
import { requireTherapist } from "@/lib/auth";

export default async function ClientHubPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireTherapist();
  if (!session?.therapistId) redirect("/login");

  const db = getDb();
  const [client] = await db
    .select()
    .from(clients)
    .where(
      and(eq(clients.id, id), eq(clients.therapistId, session.therapistId)),
    )
    .limit(1);

  if (!client) notFound();

  const [assessment] = await db
    .select()
    .from(assessments)
    .where(eq(assessments.clientId, id))
    .orderBy(desc(assessments.updatedAt))
    .limit(1);

  let linked: { id: string; pseudonym: string } | null = null;
  if (client.linkedClientId) {
    const [partner] = await db
      .select({ id: clients.id, pseudonym: clients.pseudonym })
      .from(clients)
      .where(eq(clients.id, client.linkedClientId))
      .limit(1);
    linked = partner ?? null;
  }

  const allOwned = await db
    .select()
    .from(clients)
    .where(eq(clients.therapistId, session.therapistId));
  const linkOptions = allOwned.filter((c) => c.id !== id && !c.linkedClientId);

  const status = assessment?.status ?? "none";
  const complete = status === "complete";
  const needsLink = complete && !client.linkedClientId;

  const continueHref =
    !assessment || status === "cards"
      ? `/clients/${id}/cards`
      : status === "review"
        ? `/clients/${id}/review`
        : status === "house"
          ? `/clients/${id}/house`
          : status === "outcome"
            ? `/clients/${id}/outcome`
            : status === "therapist"
              ? `/clients/${id}/therapist`
              : `/clients/${id}/summary`;

  return (
    <AppShell username={session.username}>
      <p className="text-sm text-[var(--ink-muted)]">
        <Link href="/clients">Clients</Link> / {client.pseudonym}
      </p>
      <h1 className="mt-2 text-3xl sm:text-4xl">{client.pseudonym}</h1>
      <p className="mt-2 text-[var(--ink-muted)]">
        Status: <span className="capitalize">{status}</span>
        {linked ? ` · Linked to ${linked.pseudonym}` : ""}
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href={continueHref}
          className="rounded-full btn-primary px-5 py-2.5 text-sm"
        >
          {complete ? "View summary" : "Continue assessment"}
        </Link>
        {complete && client.linkedClientId && (
          <Link
            href={`/couples/${id}`}
            className="rounded-full border border-[var(--border)] px-5 py-2.5 text-sm"
          >
            Couple conclusion
          </Link>
        )}
      </div>

      <ClientHubActions
        clientId={id}
        needsLink={needsLink}
        linkOptions={linkOptions.map((c) => ({
          id: c.id,
          pseudonym: c.pseudonym,
        }))}
      />
    </AppShell>
  );
}
