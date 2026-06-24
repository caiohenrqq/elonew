# Contributing

## Changes

- Keep one concern per branch and pull request.
- Prefer small, reviewable diffs.
- Do not mix unrelated cleanup with behavior changes.
- Update the canonical document when behavior or workflow changes.
- Track future work in GitHub Issues, not TODO documents.

## Commits

Use Conventional Commits:

```text
<type>(<scope>): <description>
```

Common types: `feat`, `fix`, `docs`, `refactor`, `test`, `build`, `ci`, `chore`.

Common scopes: `api`, `web`, `workers`, `shared`, `database`, `auth`,
`integrations`, `infra`, `docs`.

Use `!` or a `BREAKING CHANGE:` footer for breaking changes.

## Issues

Issues state the task, why it matters, and objective completion criteria.
GitHub Issues are the roadmap and technical-debt ledger.

## Pull requests

PRs include:

- a short summary;
- the issue they close;
- exact verification commands;
- skipped checks and remaining risk;
- screenshots only for visible UI changes;
- breaking changes, or `None`.

## Verification

Run the smallest relevant check while developing, then the complete applicable
suite before review. Never report a check as passing unless it ran.
