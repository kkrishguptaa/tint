# tint

## Agent skills

### Issue tracker

GitHub Issues via `gh` (`kkrishguptaa/tint`). See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: root `CONTEXT.md` + `docs/adr/`. See `docs/agents/domain.md`.

## Learned User Preferences

- Therapist-authenticated multi-client app (Neon); no client accounts for v1
- Couples via linked clients; conclusion when both assessments are complete
- Same-device facilitation by default; optional share-form link at client creation covers cards/swipe only (house + N/A/H stay on therapist device)
- Per-client flow: swipe → questions by intimacy type → house → house outcome + like/dislike/love map → therapist tags → final
- Therapist feedback: neglected / appreciated / hope-to-work-towards multi-selects only (no free-text remarks)
- Comparative conclusion: intimacy-type grades /10 → houses side by side → therapist questions side by side → intimacy-type Venn
- Settings: edit questions in DB with tags; clients use the same tag pool
- Deck personalization: a client only sees questions that share at least one tag with them; untagged questions appear for all clients
- Prefer responsive layouts that work well on phone and tablet (therapist device + shared-link swipe)
- Results focus on scales + Venn only; no recommendations; no high/mid/low bands on individual scales

## Learned Workspace Facts

- tint: therapist login, client CRUD/linking, per-client assessments on Neon Postgres (Drizzle)
- Clients: pseudonym, relationship type (Cis-het, queer, trans), optional partner link, tags from shared pool
- Ten intimacy dimensions (types): physical + sexual, emotional, intellectual, spiritual, experiential, creative, financial, social, conflict, aesthetic — not renamed; “commandments” was a mistaken label for these
- Questionnaire answers use a 3-way swipe: left = dislike, up = love, right = like; committed swipes exit off-screen (cancel snaps back)
- Cards shuffled per assessment; Ctrl+Option+K fills remaining cards randomly (therapist debug)
- Questions are moving to DB (settings-editable) with tags; not static-only JSON long-term
- Venn comparison is intensity-aware: common when both at least like an item; strong common when both love; unique when only one likes
- Openness house: place all 10 dimensions on 4 floors (top = hard to open about, bottom = easy); multiple dimensions per floor allowed
- Client summary: intimacy-type headings with prompt bubbles under dislike / like / love (SSR; no post-navigation state flicker)
