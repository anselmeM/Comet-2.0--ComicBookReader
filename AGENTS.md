# AGENTS.md — Comet operating rules

Standing instructions for AI agents (and helpful for humans) working in this repo.
Human-facing version: [CONTRIBUTING.md](./CONTRIBUTING.md).

## Golden rules

1. **Never push to `master` directly.** Every change lands via a Pull Request.
   `master` is protected: PR required, required status checks, force-push disabled.
2. **Conventional Commits**: `feat:` `fix:` `refactor:` `perf:` `test:` `docs:` `ci:`
   `chore:` `security:` `revert:` — one logical change per commit (atomic), imperative
   summary ≤ 72 chars, body explains WHY not what.
3. **CI is the gate**: never merge red. Run checks locally before pushing; the branch
   protection rule requires `Lint`, `Type Check`, and `Unit Tests` on the PR.
4. **Never rewrite pushed/shared history.** Rebase/squash only on your own unpushed
   branch; force-push with `--force-with-lease` only when unavoidable.
5. **Recovery first**: `git reflog`, backup branch before risky ops, `git revert`
   (not history rewrite) to roll back.
6. **No secrets in code.** Env vars live in Vercel/GitHub secrets; never commit `.env`.

## Workflow

```bash
git switch master && git pull            # fresh, up-to-date master
git switch -c <type>/<desc>              # feat/ fix/ docs/ chore/ refactor/...
# ...atomic change(s), conventional commits...
npx tsc --noEmit && npm run lint && npx vitest run --pool=threads   # local checks
git push -u origin <type>/<desc>
gh pr create --fill
gh pr merge --squash --delete-branch     # after CI is green
```

- Branch names: `<type>/<brief-description>` (lowercase, hyphens).
- Keep PRs small (< ~400 lines).

## Repo map

- `src/app/` — Next.js App Router pages and API routes (`api/` handlers are Vercel
  serverless functions).
- `src/components/` — React components: `atoms/` `molecules/` `organisms/`.
- `src/stores/` — Zustand stores (e.g. `readerStore`).
- `src/lib/` — shared utilities; `metadata-parser.ts` handles ComicVine metadata.
- `prisma/` — Prisma schema (PostgreSQL provider enforced by
  `scripts/guard-prisma-schema.js`) and migrations.
- `.husky/` — git hooks: `pre-commit` (guard-prisma → typecheck → lint-staged → tests)
  and `pre-push` (blocks direct pushes to `master`).

## Environment notes

- Windows dev: `vitest` fork pool hangs — run tests with
  `npx vitest run --pool=threads`.
- Deploy: Vercel (preview per PR, production on merge to `master`).
- Pre-commit hook runs the full test suite; if it hangs locally, run the steps
  manually and commit with `--no-verify` — CI remains the authoritative gate.
