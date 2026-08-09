"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { DIMENSION_LABELS } from "@/lib/content";
import { DIMENSION_IDS, type DimensionId } from "@/lib/types";

type Tag = { id: string; name: string };
type Question = {
  id: string;
  dimension: DimensionId;
  title: string;
  prompt: string;
  active: boolean;
  tags: { id: string; name: string }[];
};

export default function SettingsPage() {
  const router = useRouter();
  const [username, setUsername] = useState<string>();
  const [tags, setTags] = useState<Tag[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [tagName, setTagName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    dimension: "emotional" as DimensionId,
    title: "",
    prompt: "",
    active: true,
    tagIds: [] as string[],
  });
  const [message, setMessage] = useState<string | null>(null);

  async function reload() {
    const [t, q] = await Promise.all([
      fetch("/api/tags").then((r) => r.json()),
      fetch("/api/questions").then((r) => r.json()),
    ]);
    setTags(t.tags || []);
    setQuestions(q.questions || []);
  }

  useEffect(() => {
    async function load() {
      const me = await fetch("/api/auth/me").then((r) => r.json());
      if (!me.isLoggedIn) {
        router.replace("/login");
        return;
      }
      setUsername(me.username);
      await reload();
    }
    void load();
  }, [router]);

  async function addTag(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: tagName }),
    });
    if (!res.ok) {
      setMessage("Could not create tag");
      return;
    }
    setTagName("");
    setMessage("Tag added");
    await reload();
  }

  async function deleteTag(id: string) {
    await fetch("/api/tags", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await reload();
  }

  function startEdit(q: Question) {
    setEditingId(q.id);
    setForm({
      dimension: q.dimension,
      title: q.title,
      prompt: q.prompt,
      active: q.active,
      tagIds: q.tags.map((t) => t.id),
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm({
      dimension: "emotional",
      title: "",
      prompt: "",
      active: true,
      tagIds: [],
    });
  }

  async function saveQuestion(e: React.FormEvent) {
    e.preventDefault();
    const body = {
      ...form,
      ...(editingId ? { id: editingId } : {}),
    };
    const res = await fetch("/api/questions", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      setMessage("Could not save question");
      return;
    }
    setMessage(editingId ? "Question updated" : "Question created");
    resetForm();
    await reload();
  }

  async function deleteQuestion(id: string) {
    await fetch("/api/questions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await reload();
  }

  function toggleFormTag(id: string) {
    setForm((f) => ({
      ...f,
      tagIds: f.tagIds.includes(id)
        ? f.tagIds.filter((t) => t !== id)
        : [...f.tagIds, id],
    }));
  }

  return (
    <AppShell username={username}>
      <h1 className="text-3xl sm:text-4xl">Settings</h1>
      <p className="mt-2 text-sm text-[var(--ink-muted)]">
        Manage the shared tag pool and questions. Untagged questions appear for
        every client; tagged questions only for clients with a matching tag.
      </p>
      {message && (
        <p className="mt-4 text-sm text-[var(--accent-text)]">{message}</p>
      )}

      <section className="mt-10 space-y-4">
        <h2 className="text-2xl">Tags</h2>
        <form onSubmit={addTag} className="flex flex-wrap gap-2">
          <input
            value={tagName}
            onChange={(e) => setTagName(e.target.value)}
            placeholder="New tag"
            className="min-w-[12rem] flex-1 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2"
          />
          <button type="submit" className="rounded-full btn-primary px-4 py-2 text-sm">
            Add tag
          </button>
        </form>
        <div className="flex flex-wrap gap-2">
          {tags.map((t) => (
            <span
              key={t.id}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-sm"
            >
              {t.name}
              <button
                type="button"
                onClick={() => deleteTag(t.id)}
                className="text-[var(--ink-muted)]"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-2xl">{editingId ? "Edit question" : "New question"}</h2>
        <form onSubmit={saveQuestion} className="space-y-3 max-w-2xl">
          <select
            value={form.dimension}
            onChange={(e) =>
              setForm((f) => ({ ...f, dimension: e.target.value as DimensionId }))
            }
            className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2"
          >
            {DIMENSION_IDS.map((d) => (
              <option key={d} value={d}>
                {DIMENSION_LABELS[d]}
              </option>
            ))}
          </select>
          <input
            required
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Title"
            className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2"
          />
          <textarea
            required
            value={form.prompt}
            onChange={(e) => setForm((f) => ({ ...f, prompt: e.target.value }))}
            placeholder="Prompt"
            rows={3}
            className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2"
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) =>
                setForm((f) => ({ ...f, active: e.target.checked }))
              }
            />
            Active
          </label>
          <div className="flex flex-wrap gap-2">
            {tags.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => toggleFormTag(t.id)}
                className={`rounded-full border px-3 py-1 text-sm ${
                  form.tagIds.includes(t.id)
                    ? "border-[var(--espresso)] bg-[var(--espresso)] text-[var(--warm-white)]"
                    : "border-[var(--border)]"
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="submit" className="rounded-full btn-primary px-5 py-2 text-sm">
              {editingId ? "Update" : "Create"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-full border border-[var(--border)] px-5 py-2 text-sm"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="mt-12 space-y-3">
        <h2 className="text-2xl">Questions ({questions.length})</h2>
        <ul className="space-y-3">
          {questions.map((q) => (
            <li
              key={q.id}
              className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-xs uppercase text-[var(--ink-muted)]">
                    {DIMENSION_LABELS[q.dimension]}
                    {!q.active ? " · inactive" : ""}
                  </p>
                  <p className="font-medium">{q.title}</p>
                  <p className="mt-1 text-sm text-[var(--ink-muted)]">{q.prompt}</p>
                  <p className="mt-2 text-xs text-[var(--ink-muted)]">
                    Tags:{" "}
                    {q.tags.length
                      ? q.tags.map((t) => t.name).join(", ")
                      : "all clients"}
                  </p>
                </div>
                <div className="flex gap-2 text-sm">
                  <button type="button" onClick={() => startEdit(q)}>
                    Edit
                  </button>
                  <button type="button" onClick={() => deleteQuestion(q.id)}>
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-8">
        <Link href="/clients" className="text-sm text-[var(--accent-text)]">
          ← Clients
        </Link>
      </p>
    </AppShell>
  );
}
