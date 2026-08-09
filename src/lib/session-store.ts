import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Report } from "./types";

const TTL_MS = 7 * 24 * 60 * 60 * 1000;

export type StoredSession = {
  id: string;
  expiresAt: string;
  report: Report;
};

function rootDir(base = process.cwd()) {
  return path.join(base, ".data", "sessions");
}

export async function createSession(
  report: Report,
  options?: { baseDir?: string; now?: Date },
): Promise<{ id: string; expiresAt: string }> {
  const id = randomUUID();
  const now = options?.now ?? new Date();
  const expiresAt = new Date(now.getTime() + TTL_MS).toISOString();
  const dir = rootDir(options?.baseDir);
  await mkdir(dir, { recursive: true });
  const payload: StoredSession = { id, expiresAt, report };
  await writeFile(path.join(dir, `${id}.json`), JSON.stringify(payload), "utf8");
  return { id, expiresAt };
}

export async function getSession(
  id: string,
  options?: { baseDir?: string; now?: Date },
): Promise<Report | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const file = path.join(rootDir(options?.baseDir), `${id}.json`);
  try {
    const raw = await readFile(file, "utf8");
    const stored = JSON.parse(raw) as StoredSession;
    const now = options?.now ?? new Date();
    if (new Date(stored.expiresAt).getTime() <= now.getTime()) return null;
    return stored.report;
  } catch {
    return null;
  }
}
