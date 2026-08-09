# tint

## Agent skills

### Issue tracker

GitHub Issues via `gh` (`kkrishguptaa/tint`). See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: root `CONTEXT.md` + `docs/adr/`. See `docs/agents/domain.md`.

## Learned User Preferences

- Couples-first for MVP with per-partner therapist pass-offs (solo scales, openness house, consolidated view, free-text reflections) before the couple Venn/stats finale
- Same-device turn-taking questionnaire for v1 (no accounts)
- Short-lived shareable results links for session persistence in v1
- Use the configured `cursor/` prefix for agent-created feature branches
- Results focus on scales + Venn only; no recommendations

## Learned Workspace Facts

- tint is a greenfield couple intimacy assessment product: each partner completes the questionnaire once, then scores, scale comparison, and an intensity-aware Venn
- Ten intimacy dimensions: physical + sexual, emotional, intellectual, spiritual, experiential, creative, financial, social, conflict, aesthetic
- Questionnaire answers use a 3-way swipe: left = not like, up = like, right = very like; committed swipes exit off-screen (cancel snaps back)
- Venn comparison is intensity-aware: common when both at least like an item; strong common when both very-like; unique when only one likes
- Openness house: place all 10 dimensions on 4 floors (top = hard to open about, bottom = easy); multiple dimensions per floor allowed
