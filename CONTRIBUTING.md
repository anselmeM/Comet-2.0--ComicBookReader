# Contributing to Comet

Comet is a comic-book reader built with Next.js (App Router), Prisma (PostgreSQL),
and deployed on Vercel. This guide describes how changes get in.

## How changes land

- **Never push to `master` directly.** `master` is protected: every change goes
  through a pull request with required checks.
- Use a feature branch off an up-to-date `master`:

  ```bash
  git switch master && git pull
  git switch -c <type>/<desc>        # e.g. feat/guided-view, fix/reader-tap
  # make your change(s), then:
  npx tsc --noEmit && npm run lint && npx vitest run --pool=threads
  git push -u origin <type>/<desc>
  gh pr create                       # template included in the PR body
  ```

- Merge via **squash** once CI is green; the branch is deleted automatically.

## Commit messages

Conventional Commits, one logical change per commit:

```
fix: restore typecheck by omitting null metadata writes
feat: add guided view panel transitions
```

Summary ≤ 72 chars, imperative mood. Body explains the WHY.

## Checks

The CI workflow runs **Lint**, **Type Check**, **Unit Tests**, and **Build**
(the first three are required on PRs). The pre-commit hook mirrors this locally:
Prisma-schema guard → typecheck → lint-staged (eslint + prettier) → tests.

Windows note: `vitest`'s default fork pool can hang — use
`npx vitest run --pool=threads`.

## PR checklist

- [ ] Conventional, atomic commit(s)
- [ ] Local checks pass
- [ ] CI green
- [ ] No secrets/PII, no debug leftovers
- [ ] Tests added/updated for changed behavior
- [ ] Docs updated if workflow/API/env changed

## Rollback

`git revert <hash>` on a branch → PR. Never rewrite `master` history.

## Questions

Open an issue or discuss in the PR. Keep PRs small — split big changes.
