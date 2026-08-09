# tint

## Agent skills

### Issue tracker

GitHub Issues via `gh` (`kkrishguptaa/tint`). See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: root `CONTEXT.md` + `docs/adr/`. See `docs/agents/domain.md`.

## Learned User Preferences

- Couples-first for MVP; therapist/coach tooling comes later
- Same-device turn-taking questionnaire for v1 (no accounts)
- Short-lived shareable results links for session persistence in v1
- Use the configured `cursor/` prefix for agent-created feature branches

## Learned Workspace Facts

- tint is a greenfield couple intimacy assessment product: each partner completes the questionnaire once, then scores, scale comparison, and an intensity-aware Venn
- Ten intimacy dimensions: physical + sexual, emotional, intellectual, spiritual, experiential, creative, financial, social, conflict, aesthetic
- Questionnaire answers use a 3-way swipe: left = not like, up = like, right = very like
- Venn comparison is intensity-aware: common when both at least like an item; strong common when both very-like; unique when only one likes
