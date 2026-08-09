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
- Same-device facilitation on the therapist device; cards → house → therapist tags/remarks → summary
- Use the configured `cursor/` prefix for agent-created feature branches
- Results focus on scales + Venn only; no recommendations

## Learned Workspace Facts

- tint: therapist login, client CRUD/linking, per-client assessments on Neon Postgres (Drizzle)
- Ten intimacy dimensions: physical + sexual, emotional, intellectual, spiritual, experiential, creative, financial, social, conflict, aesthetic
- Questionnaire answers use a 3-way swipe: left = not like, up = like, right = very like; committed swipes exit off-screen (cancel snaps back)
- Cards shuffled per assessment; Ctrl+Option+K fills remaining cards randomly (therapist debug)
- Venn comparison is intensity-aware: common when both at least like an item; strong common when both very-like; unique when only one likes
- Openness house: place all 10 dimensions on 4 floors (top = hard to open about, bottom = easy); multiple dimensions per floor allowed
- Therapist form: neglected / appreciated / hope-to-work-towards multi-selects + free-text remarks
- Client summary: intimacy-type headings with prompt bubbles under not like / like / very like (SSR)
