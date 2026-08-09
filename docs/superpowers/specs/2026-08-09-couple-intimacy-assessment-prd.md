# tint — Couple Intimacy Assessment PRD (v1)

**Status:** Approved for implementation (Approach 1)  
**Date:** 2026-08-09  
**Product:** tint

## 1. Problem

Couples lack a lightweight, private way to surface where they align and diverge across intimacy dimensions — and what to try next — without accounts, therapists, or a heavy quiz UX.

## 2. Goals (v1)

- Let two partners each complete the same swipe questionnaire **once**, on the **same device**, in turn.
- Score each partner on **10 intimacy dimensions**.
- Show **where each lies on each scale**, an **intensity-aware Venn** of card overlap, and **recommendations** from shipped seed data.
- Persist a finished report behind a **short-lived shareable link** (no accounts).

## 3. Non-goals (v1)

- User accounts, login, or couple history
- Therapist / coach dashboard (couples-first; tooling later)
- Multi-device live sync during the quiz
- Editing answers after handoff
- CMS / admin UI for content (content is in-repo JSON)

## 4. Primary users

| Priority | User | v1 support |
| -------- | ---- | ---------- |
| P0 | Couples (self-serve) | Full flow |
| P1 | Therapists / coaches | Can use the same flow with a couple; no dedicated tooling yet |

## 5. Dimensions

Exactly these ten (order fixed in seed data):

1. physical + sexual  
2. emotional  
3. intellectual  
4. spiritual  
5. experiential  
6. creative  
7. financial  
8. social  
9. conflict  
10. aesthetic  

## 6. Answer model

Each card is answered with a **3-way swipe**:

| Gesture | Value | Meaning |
| ------- | ----- | ------- |
| Left | `dislike` (0) | Not like it |
| Up | `like` (1) | Like |
| Right | `love` (2) | Very like it |

Keyboard equivalents (desktop): ← dislike, ↑ like, → love. Undo last swipe allowed during a partner’s turn.

## 7. Scoring

**Per dimension, per partner — affinity + breadth.**

Let cards in dimension *d* for partner *p* have values in `{0,1,2}`.

- **Affinity** = mean of values over cards in *d* (range 0–2), normalized to 0–1 as `affinity = mean / 2`.
- **Breadth** = fraction of cards in *d* with value ≥ 1 (liked or loved).
- **Score** = `0.6 * affinity + 0.4 * breadth`, exposed as **0–100** (`round(score * 100)`).

**Bands** for recommendations (inclusive cutoffs on 0–100):

| Band | Range |
| ---- | ----- |
| low | 0–33 |
| mid | 34–66 |
| high | 67–100 |

## 8. Venn (intensity-aware)

For each card both partners answered:

- **Strong common** — both `love`
- **Common** — both value ≥ `like`, and not strong common
- **A-only** — A ≥ like, B = dislike  
- **B-only** — B ≥ like, A = dislike  
- Cards both dislike are omitted from the Venn

## 9. Recommendations

Dual model, both from shipped seed JSON:

1. **Band-combo tips** — rows keyed by `dimension` + `partnerABand` + `partnerBBand` (order-independent matching: store canonical sorted pair or match either orientation).
2. **Item-overlap tips** — rows keyed by card id(s) or tags for strong-common / common / unique-gap situations.

Display: up to 3 band tips (highest-priority dimensions by |scoreA − scoreB| then low joint scores) + up to 5 overlap tips (prefer strong-common, then common, then unique gaps).

## 10. Product flow

1. Landing + **18+ consent** gate  
2. Partner A optional display name → swipe full deck  
3. Handoff (“pass the device”); A’s answers not shown  
4. Partner B optional display name → same deck  
5. Client computes scores, Venn, recommendations  
6. Results UI; **Save & share** → POST anonymized payload → expiring link (default **7 days**)  
7. `/r/[id]` read-only report; expired → soft end state  

## 11. Architecture

**Client-heavy + thin results API.**

- Browser owns the quiz session and scoring.
- On save: `POST /api/sessions` with finished report JSON; response `{ id, expiresAt, url }`.
- `GET /api/sessions/[id]` returns report if not expired.
- Storage: server filesystem under `.data/sessions/` (gitignored) with `expiresAt`; suitable for single-node MVP. Swap later for Redis/KV without changing the API contract.
- Seed content: `data/cards.json`, `data/recommendations.json`.

## 12. Platform & UX

- Responsive **web app**, mobile-first swipe UX
- Results and scales readable on desktop
- No install / PWA requirement in v1
- Privacy copy: answers stay on-device until a partner chooses Save & share; shared links expire

## 13. Content

Shipped curated seed in-repo (JSON). v1 includes a small but complete pack: ≥3 cards per dimension (≥30 cards total) and enough recommendation rows to demo both tip types.

## 14. Success criteria

- Two partners can complete the flow on one phone without accounts  
- Results show 10 dual scales, Venn buckets, and non-empty recommendations for the seed deck  
- Shared link loads the same report until expiry, then fails closed  
- Core scoring / Venn / recommendation matching covered by unit tests  

## 15. Open follow-ups (not v1)

- Therapist multi-couple workspace  
- Account-backed history  
- CMS for cards  
- Richer analytics / research export  
