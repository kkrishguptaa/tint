import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { AppShell } from "@/components/AppShell";
import { getDb } from "@/db";
import { assessments, clients } from "@/db/schema";
import { requireTherapist } from "@/lib/auth";
import { DIMENSION_LABELS, getCards } from "@/lib/content";
import {
  DIMENSION_IDS,
  HOUSE_FLOOR_LABELS,
  type Answers,
  type DimensionId,
  type HouseFloor,
  type SwipeValue,
} from "@/lib/types";

const FLOORS: HouseFloor[] = [4, 3, 2, 1];

const SWIPE_GROUPS: { value: SwipeValue; label: string; bubbleClass: string }[] =
  [
    {
      value: "dislike",
      label: "Not like",
      bubbleClass:
        "bg-[color-mix(in_srgb,var(--dislike)_18%,var(--warm-white))] text-[var(--dislike)] ring-1 ring-[color-mix(in_srgb,var(--dislike)_35%,transparent)]",
    },
    {
      value: "like",
      label: "Like",
      bubbleClass:
        "bg-[color-mix(in_srgb,var(--like)_16%,var(--warm-white))] text-[var(--like)] ring-1 ring-[color-mix(in_srgb,var(--like)_35%,transparent)]",
    },
    {
      value: "love",
      label: "Very like",
      bubbleClass:
        "bg-[color-mix(in_srgb,var(--love)_16%,var(--warm-white))] text-[var(--love)] ring-1 ring-[color-mix(in_srgb,var(--love)_35%,transparent)]",
    },
  ];

function promptsBySwipe(dim: DimensionId, answers: Answers) {
  const groups: Record<SwipeValue, string[]> = {
    dislike: [],
    like: [],
    love: [],
  };
  for (const card of getCards()) {
    if (card.dimension !== dim) continue;
    const value = answers[card.id] as SwipeValue | undefined;
    if (!value) continue;
    groups[value].push(card.prompt);
  }
  return groups;
}

export default async function SummaryPage({
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

  if (!assessment || assessment.status !== "complete") {
    redirect(`/clients/${id}`);
  }

  const house = (assessment.house || {}) as Record<DimensionId, HouseFloor>;
  const answers = (assessment.answers || {}) as Answers;
  const neglected = assessment.neglected as string[];
  const appreciated = assessment.appreciated as string[];
  const hopes = assessment.hopes as string[];

  return (
    <AppShell username={session.username}>
      <p className="text-sm text-[var(--ink-muted)]">
        <Link href={`/clients/${id}`}>← {client.pseudonym}</Link>
      </p>
      <h1 className="mt-2 text-4xl">Summary · {client.pseudonym}</h1>

      <section className="mt-10 space-y-4">
        <h2 className="text-2xl">Openness house</h2>
        <div className="space-y-2">
          {FLOORS.map((floor) => {
            const dims = DIMENSION_IDS.filter((d) => house[d] === floor);
            return (
              <div
                key={floor}
                className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3"
              >
                <p className="text-xs uppercase text-[var(--accent-text)]">
                  Floor {floor} · {HOUSE_FLOOR_LABELS[floor]}
                </p>
                <p className="mt-1 text-sm">
                  {dims.length
                    ? dims.map((d) => DIMENSION_LABELS[d]).join(", ")
                    : "—"}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-2xl">Intimacy focus</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {(
            [
              ["Neglected", neglected],
              ["Appreciated", appreciated],
              ["Hopes", hopes],
            ] as const
          ).map(([label, list]) => (
            <div
              key={label}
              className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4"
            >
              <h3 className="text-sm uppercase text-[var(--ink-muted)]">{label}</h3>
              <ul className="mt-2 space-y-1 text-sm">
                {list.length === 0 ? (
                  <li className="text-[var(--ink-muted)]">—</li>
                ) : (
                  list.map((d) => (
                    <li key={d}>{DIMENSION_LABELS[d as DimensionId] ?? d}</li>
                  ))
                )}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10 space-y-8">
        <div>
          <h2 className="text-2xl">Swipe map</h2>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">
            Prompts grouped by intimacy type and swipe.
          </p>
        </div>
        {DIMENSION_IDS.map((dim) => {
          const groups = promptsBySwipe(dim, answers);
          return (
            <div key={dim} className="space-y-4">
              <h3 className="text-xl">{DIMENSION_LABELS[dim]}</h3>
              <div className="grid gap-4 lg:grid-cols-3">
                {SWIPE_GROUPS.map(({ value, label, bubbleClass }) => (
                  <div key={value} className="space-y-2">
                    <p className="text-xs uppercase tracking-wide text-[var(--ink-muted)]">
                      {label}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {groups[value].length === 0 ? (
                        <span className="text-sm text-[var(--ink-muted)]">—</span>
                      ) : (
                        groups[value].map((prompt) => (
                          <span
                            key={prompt}
                            className={`inline-block max-w-full rounded-full px-3 py-1.5 text-sm leading-snug ${bubbleClass}`}
                          >
                            {prompt}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="text-2xl">Therapist remarks</h2>
        <p className="whitespace-pre-wrap rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
          {assessment.remarks?.trim() || "No remarks yet."}
        </p>
      </section>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href={`/clients/${id}`}
          className="rounded-full btn-primary px-5 py-2.5 text-sm"
        >
          Back to client
        </Link>
        {client.linkedClientId && (
          <Link
            href={`/couples/${id}`}
            className="rounded-full border border-[var(--border)] px-5 py-2.5 text-sm"
          >
            Couple conclusion
          </Link>
        )}
      </div>
    </AppShell>
  );
}
