"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    setPending(false);
    if (!res.ok) {
      setError("Invalid username or password");
      return;
    }
    router.push("/clients");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-16">
      <p className="text-sm tracking-[0.35em] uppercase text-[var(--accent-text)]">tint</p>
      <h1 className="mt-4 text-4xl">Therapist login</h1>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <label className="block space-y-2 text-sm">
          <span>Username</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 outline-none focus:border-[var(--accent)]"
            autoComplete="username"
          />
        </label>
        <label className="block space-y-2 text-sm">
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 outline-none focus:border-[var(--accent)]"
            autoComplete="current-password"
          />
        </label>
        {error && <p className="text-sm text-[var(--accent-text)]">{error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="rounded-full btn-primary px-6 py-3 disabled:opacity-50"
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}
