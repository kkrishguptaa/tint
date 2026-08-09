# tint

Therapist-facing couple intimacy assessment for The Coping Central.

## Features

- Therapist login + **Settings** for questions and shared tags
- Client table with pseudonym, relationship type, tags, optional partner link
- Optional **shareable swipe link** (cards only) at client creation
- Flow: swipe → review map → house → house outcome + map → N/A/H tags → summary
- Swipe: left = dislike, up = love, right = like
- Couple conclusion: grades /10 → houses → N/A/H → intimacy-type Venn → prompt Venns
- Debug: **Ctrl+Option+K** on the cards screen fills remaining cards randomly

## Setup

```bash
cp .env.example .env.local
# set DATABASE_URL (Neon) and SESSION_SECRET

npm install
npm run db:push
npm run db:seed
npm run db:seed:questions
npm run dev
```

Default seeded therapist: `utkarsha` (password set via seed script).

## Scripts

- `npm run dev` — Next.js
- `npm test` — Vitest
- `npm run db:push` — push Drizzle schema to Neon
- `npm run db:seed` — upsert therapist with bcrypt password hash
- `npm run db:seed:questions` — import `data/cards.json` into DB questions (untagged = all clients)

## Content

Questions are edited in **Settings** (Neon). `data/cards.json` is the seed source for `db:seed:questions`.
Untagged questions appear for every client; tagged questions only when the client shares a tag.
