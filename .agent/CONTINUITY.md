# CONTINUITY

## [PLANS]
- 2026-03-21T08:08:03-04:00 [USER] Keep `AGENTS.md` concise, preserve key repo rules, reduce overlap, and reorder issue execution so issue review and planning happen before branch creation.

## [DECISIONS]
- 2026-03-21T08:08:03-04:00 [CODE] `AGENTS.md` now uses a consolidated structure with a global operating baseline first and repo-specific rules second.
- 2026-03-21T08:08:03-04:00 [CODE] Issue workflow order is now: inspect issue, check overlap, prepare plan, then create branch/worktree/PR, then implement and verify.
- 2026-03-21T08:08:03-04:00 [CODE] Workspace change history should live in `.agent/CHANGELOG.md` instead of inline in `AGENTS.md`.
- 2026-03-21T08:08:03-04:00 [CODE] `AGENTS.md` now explicitly distinguishes `.agent/CONTINUITY.md` as current-state handoff context and `.agent/CHANGELOG.md` as durable project history.

## [PROGRESS]
- 2026-03-21T08:08:03-04:00 [TOOL] Rewrote `AGENTS.md` to merge the requested baseline with existing repo-specific rules and added this continuity file scaffold.
- 2026-03-21T08:08:03-04:00 [TOOL] Moved the existing inline `AGENTS.md` changelog into `.agent/CHANGELOG.md` and updated maintenance guidance to point there.
- 2026-03-21T08:08:03-04:00 [TOOL] Added an explicit `CONTINUITY.md` versus `CHANGELOG.md` boundary section to `AGENTS.md`.

## [DISCOVERIES]
- 2026-03-21T08:08:03-04:00 [TOOL] `.agent/CONTINUITY.md` did not exist before this change.

## [OUTCOMES]
- 2026-03-21T08:08:03-04:00 [CODE] Workspace guidance now has an explicit continuity mechanism and a less overlapping issue-start workflow.
- 2026-03-21T08:08:03-04:00 [CODE] `AGENTS.md` is shorter and operational, while historical change notes now live in `.agent/CHANGELOG.md`.
