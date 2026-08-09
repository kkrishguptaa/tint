"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export function AppShell({
  username,
  children,
}: {
  username?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-dvh">
      <header className="border-b border-[var(--border)] bg-[var(--bg-elevated)]">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/clients" className="tracking-[0.2em] uppercase text-[var(--accent-text)]">
            tint
          </Link>
          <div className="flex items-center gap-4 text-sm">
            {username && <span className="text-[var(--ink-muted)]">{username}</span>}
            <button type="button" onClick={logout} className="text-[var(--accent-text)]">
              Log out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
    </div>
  );
}
