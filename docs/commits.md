# Commit Conventions

This project follows Conventional Commits `v1.0.0` as the baseline:
- https://www.conventionalcommits.org/en/v1.0.0/

## Commit format

```text
<type>[optional scope][optional !]: <description>

[optional body]

[optional footer(s)]
```

## Required rules

- `type` is required.
- `description` is required and must be short and objective.
- Use lowercase for `type` and `scope`.
- Use `!` before `:` for breaking changes (or use `BREAKING CHANGE:` footer).
- Keep one logical change per commit when possible.

## Subject wording rule

- When possible, prefer `&` instead of `and` when joining the final item in commit subjects.
- Example: use `add dev/prod docker layout & workspace scripts` instead of `add dev/prod docker layout and workspace scripts`.
- For multiple separated items, apply `&` only to the last join.

Example:
- `add dev/prod docker layout, add xyz, add abc & workspace scripts`

## Allowed types

- `feat`: new feature
- `fix`: bug fix
- `docs`: documentation-only changes
- `refactor`: code change without behavior change
- `perf`: performance improvement
- `test`: tests added/updated
- `build`: build system/dependency/tooling changes
- `ci`: CI/CD changes
- `chore`: maintenance tasks not affecting app behavior
- `revert`: revert a previous commit

## Recommended scopes

- `api`
- `web`
- `workers`
- `shared`
- `database`
- `auth`
- `ui`
- `testing`
- `integrations`
- `docs`
- `infra`

## Examples

```text
feat(api): add order cancellation use-case
fix(web): handle empty ticket list state
docs(architecture): clarify ports and adapters boundaries
refactor(workers): split queue bootstrap from processor registry
build(repo): add biome and workspace scripts
chore(deps): update pnpm lockfile
feat(auth)!: require 2fa for admin login

BREAKING CHANGE: admin login now requires a second authentication factor
```

## Semantic Version mapping

- `fix` => `PATCH`
- `feat` => `MINOR`
- any commit with `!` or `BREAKING CHANGE:` => `MAJOR`

Other types do not imply a version bump by themselves.

## Bodies and footers

- Use body to explain context when title is not enough.
- Use footers for references and metadata:
  - `Refs: #123`
  - `Closes: #456`
  - `Reviewed-by: Name`
  - `BREAKING CHANGE: <impact>`

## Extension/versioning rule

If this project extends these commit conventions in the future, version the extension itself with SemVer.
This follows the Conventional Commits FAQ recommendation for specification extensions.
