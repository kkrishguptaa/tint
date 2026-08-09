# Couple Intimacy MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a mobile-first web app where two partners take turns swiping a seed intimacy deck, then see dual scales, an intensity-aware Venn, recommendations, and an expiring share link.

**Architecture:** Next.js App Router client owns the quiz + scoring; thin Route Handlers persist finished reports under `.data/sessions/` with TTL; cards and recommendations ship as static JSON.

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Vitest, Zod

## Global Constraints

- Couples-first, same-device turn-taking, no accounts
- 3-way swipe: left=`dislike`, up=`like`, right=`love`
- Score = `0.6 * affinity + 0.4 * breadth` → 0–100; bands low/mid/high at 0–33 / 34–66 / 67–100
- Venn: strong-common (both love), common (both ≥ like), A-only / B-only; omit mutual dislike
- Session links expire in 7 days
- Branch prefix: `cursor/`
- Spec: `docs/superpowers/specs/2026-08-09-couple-intimacy-assessment-prd.md`

## File map

| Path | Responsibility |
| ---- | -------------- |
| `package.json`, `tsconfig.json`, `next.config.ts`, `vitest.config.ts` | Tooling |
| `data/cards.json` | Seed swipe cards |
| `data/recommendations.json` | Band + overlap tips |
| `src/lib/types.ts` | Shared domain types |
| `src/lib/scoring.ts` | Dimension scores + bands |
| `src/lib/venn.ts` | Intensity-aware Venn sets |
| `src/lib/recommendations.ts` | Tip selection |
| `src/lib/report.ts` | Assemble full report |
| `src/lib/session-store.ts` | Filesystem TTL store |
| `src/app/api/sessions/route.ts` | POST create session |
| `src/app/api/sessions/[id]/route.ts` | GET session |
| `src/app/page.tsx` | Landing + consent |
| `src/app/play/page.tsx` | Quiz orchestration |
| `src/components/SwipeDeck.tsx` | 3-way swipe UI |
| `src/components/Handoff.tsx` | Pass-the-device |
| `src/components/ResultsView.tsx` | Scales + Venn + tips |
| `src/app/r/[id]/page.tsx` | Shared results |
| `src/app/globals.css` | Theme tokens |

---

### Task 1: Scaffold Next.js app + Vitest

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `vitest.config.ts`, `postcss.config.mjs`, `src/app/layout.tsx`, `src/app/globals.css`, `src/app/page.tsx`, `.gitignore`
- Test: smoke via `npm test` / `npm run build` later

**Interfaces:**
- Produces: runnable Next.js app with Vitest (`vitest`, `jsdom`)

- [ ] **Step 1: Scaffold**

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --turbopack --yes
```

If the directory is non-empty, create files manually equivalent to create-next-app defaults instead of failing.

- [ ] **Step 2: Add Vitest**

```bash
npm i -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom zod
```

`vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: { environment: "node", include: ["src/**/*.test.ts"] },
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
});
```

Add script: `"test": "vitest run"`.

- [ ] **Step 3: Gitignore session data**

Ensure `.gitignore` contains `.data/`.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "chore: scaffold Next.js app with Vitest"
```

---

### Task 2: Domain types + scoring (TDD)

**Files:**
- Create: `src/lib/types.ts`, `src/lib/scoring.ts`, `src/lib/scoring.test.ts`

**Interfaces:**
- Produces:
  - `SwipeValue = "dislike" | "like" | "love"`
  - `DimensionId` union of the 10 ids
  - `scoreDimension(answers: SwipeValue[]): { score: number; band: "low"|"mid"|"high" }`
  - `scoreAllDimensions(cards, answersByCardId): Record<DimensionId, { score: number; band }>`

- [ ] **Step 1: Failing tests**

```ts
import { describe, expect, it } from "vitest";
import { scoreDimension } from "./scoring";

describe("scoreDimension", () => {
  it("scores all love as high ~100", () => {
    const r = scoreDimension(["love", "love", "love"]);
    expect(r.score).toBe(100);
    expect(r.band).toBe("high");
  });
  it("scores all dislike as 0 / low", () => {
    const r = scoreDimension(["dislike", "dislike"]);
    expect(r.score).toBe(0);
    expect(r.band).toBe("low");
  });
  it("blends affinity and breadth", () => {
    // one love, one dislike → affinity=0.5, breadth=0.5 → 0.6*0.5+0.4*0.5=0.5 → 50 mid
    const r = scoreDimension(["love", "dislike"]);
    expect(r.score).toBe(50);
    expect(r.band).toBe("mid");
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

`npm test -- src/lib/scoring.test.ts`

- [ ] **Step 3: Implement**

```ts
const VALUE = { dislike: 0, like: 1, love: 2 } as const;

export function scoreDimension(answers: Array<"dislike"|"like"|"love">) {
  if (answers.length === 0) return { score: 0, band: "low" as const };
  const nums = answers.map((a) => VALUE[a]);
  const affinity = nums.reduce((s, n) => s + n, 0) / nums.length / 2;
  const breadth = nums.filter((n) => n >= 1).length / nums.length;
  const score = Math.round((0.6 * affinity + 0.4 * breadth) * 100);
  const band = score <= 33 ? "low" : score <= 66 ? "mid" : "high";
  return { score, band } as const;
}
```

- [ ] **Step 4: Run — expect PASS**

- [ ] **Step 5: Commit**

```bash
git commit -m "feat: add affinity+breadth dimension scoring"
```

---

### Task 3: Venn + recommendations + report assembly (TDD)

**Files:**
- Create: `src/lib/venn.ts`, `src/lib/venn.test.ts`, `src/lib/recommendations.ts`, `src/lib/recommendations.test.ts`, `src/lib/report.ts`

**Interfaces:**
- Produces:
  - `buildVenn(cards, answersA, answersB) => { strongCommon, common, aOnly, bOnly }` (arrays of card ids)
  - `selectRecommendations(reportInput, catalog) => { bandTips, overlapTips }`
  - `buildReport(...)` combining scores, venn, tips, names

- [ ] **Step 1: Venn tests + implementation** per PRD §8

- [ ] **Step 2: Recommendation tests + implementation** per PRD §9 (max 3 band + 5 overlap)

- [ ] **Step 3: `buildReport` wiring scores + venn + tips**

- [ ] **Step 4: Commit**

```bash
git commit -m "feat: add venn, recommendations, and report builder"
```

---

### Task 4: Seed data

**Files:**
- Create: `data/cards.json`, `data/recommendations.json`, `src/lib/content.ts`

**Interfaces:**
- Produces: `getCards()`, `getRecommendationCatalog()` loading/validating JSON with Zod
- ≥3 cards per dimension; band rows for several combos; overlap tips for a few card ids

- [ ] **Step 1: Author seed JSON** (placeholder but real copy — not lorem for sexual content; keep tasteful/adult)

- [ ] **Step 2: Zod schemas + loaders**

- [ ] **Step 3: Commit**

```bash
git commit -m "feat: ship seed cards and recommendation catalog"
```

---

### Task 5: Session store + API

**Files:**
- Create: `src/lib/session-store.ts`, `src/lib/session-store.test.ts`, `src/app/api/sessions/route.ts`, `src/app/api/sessions/[id]/route.ts`

**Interfaces:**
- Produces:
  - `createSession(report): Promise<{ id: string; expiresAt: string }>`
  - `getSession(id): Promise<Report | null>` (null if missing/expired)
  - `POST /api/sessions` → 201 `{ id, expiresAt, url }`
  - `GET /api/sessions/[id]` → 200 report | 404

- [ ] **Step 1: Store tests with temp dir**

- [ ] **Step 2: Implement filesystem store under `.data/sessions/{id}.json`**

- [ ] **Step 3: Wire Route Handlers**

- [ ] **Step 4: Commit**

```bash
git commit -m "feat: add expiring session persistence API"
```

---

### Task 6: Quiz UI — landing, swipe, handoff

**Files:**
- Modify: `src/app/page.tsx`, `src/app/globals.css`, `src/app/layout.tsx`
- Create: `src/app/play/page.tsx`, `src/components/SwipeDeck.tsx`, `src/components/Handoff.tsx`, `src/lib/quiz-state.ts`

**Interfaces:**
- Client state machine: `consent → partnerA → handoff → partnerB → results`
- SwipeDeck props: `{ card, onSwipe(value), onUndo?, canUndo }`

- [ ] **Step 1: Landing with 18+ checkbox + Start**

- [ ] **Step 2: SwipeDeck with pointer + keyboard (← ↑ →)**

- [ ] **Step 3: Handoff screen clearing visible answers**

- [ ] **Step 4: Manual pass — complete both turns in browser**

- [ ] **Step 5: Commit**

```bash
git commit -m "feat: add consent, swipe deck, and handoff flow"
```

---

### Task 7: Results UI + share link page

**Files:**
- Create: `src/components/ResultsView.tsx`, `src/components/ScaleCompare.tsx`, `src/components/VennDiagram.tsx`, `src/app/r/[id]/page.tsx`

**Interfaces:**
- ResultsView renders scales, CSS/SVG Venn buckets, tips list, Save & share button calling POST
- `/r/[id]` fetches GET and renders ResultsView read-only (no save)

- [ ] **Step 1: ScaleCompare — 10 rows, two markers**

- [ ] **Step 2: VennDiagram — four labeled regions listing card titles**

- [ ] **Step 3: Save & share + `/r/[id]`**

- [ ] **Step 4: Expired session empty state**

- [ ] **Step 5: Commit**

```bash
git commit -m "feat: add results view, venn, and shareable report page"
```

---

### Task 8: Polish + verify

**Files:**
- Modify: copy, spacing, mobile swipe affordances; `README.md`

- [ ] **Step 1: `npm test` — all green**

- [ ] **Step 2: `npm run build` — success**

- [ ] **Step 3: README with run instructions + product one-liner**

- [ ] **Step 4: Commit**

```bash
git commit -m "docs: add README and verify MVP build"
```

---

## Spec coverage check

| PRD requirement | Task |
| --------------- | ---- |
| 10 dimensions + swipe values | 2, 4, 6 |
| Affinity+breadth scores + bands | 2 |
| Intensity-aware Venn | 3, 7 |
| Dual recommendations | 3, 4, 7 |
| Same-device turn-taking + handoff | 6 |
| 18+ consent | 6 |
| Expiring share link | 5, 7 |
| In-repo seed | 4 |
| Responsive web | 6, 7, 8 |
