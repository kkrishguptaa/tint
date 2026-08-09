# tint

Therapist-facing couple intimacy assessment for The Coping Central.

## Features

- Therapist login
- Client table with pseudonym, relationship type, optional partner link
- Per-client flow: shuffled swipe cards → openness house → therapist tags (neglected / appreciated / hopes) + remarks → summary
- Couple conclusion: intimacy-type Venn, alignment scores, side-by-side houses & tags, per-dimension prompt Venns
- Debug: **Ctrl+Option+K** on the cards screen fills remaining cards randomly

## Setup

```bash
cp .env.example .env.local
# set DATABASE_URL (Neon) and SESSION_SECRET

npm install
npm run db:push
npm run db:seed
npm run dev
```

Default seeded therapist: `utkarsha` (password set via seed script).

## Scripts

- `npm run dev` — Next.js
- `npm test` — Vitest
- `npm run db:push` — push Drizzle schema to Neon
- `npm run db:seed` — upsert therapist with bcrypt password hash

## Content

Edit `data/cards.json` for the swipe deck.
