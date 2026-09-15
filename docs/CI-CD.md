# CI/CD workflow — specified, not implemented

> Status: **contract only**. No GitHub Actions, no host, no secrets. Implement from [`TICKETS.md`](TICKETS.md) E10 when asked.  
> Hosting stance today: local Vite (OPEN-DECISIONS D8). The app is a static `dist/` — any later host is a CD target, not a rewrite.

## Intent

Every push and pull request should fail closed on quality before merge. Delivery to a public URL is optional and later. The pipeline never runs the CPM Engine on a server (ADR 0001).

## Triggers (when this exists)

| Event | Pipeline |
|-------|----------|
| Pull request to the default branch | **CI** only |
| Push to the default branch | **CI**; **CD** only after a host is chosen |
| Manual `workflow_dispatch` | Same as CI (debug) |

Do not run CD from forks. Do not deploy on documentation-only paths until the first CD job exists — then decide path filters.

## CI jobs

One workflow file, later: `.github/workflows/ci.yml`. Jobs share a Node version pinned to what `package.json` / the lockfile expect (do not invent a second runtime).

| Job | Command | Failure means |
|-----|---------|----------------|
| Install | `npm ci` | Lockfile drift |
| Lint | `npm run lint` | ESLint |
| Types | `npm run typecheck` | CPM Engine / TS |
| Build | `npm run build` | The SPA does not produce `dist/` |

Add **engine tests** as a CI job only after T6.6 exists (`npm test` or equivalent). Until then, do not add a red job for a missing script.

Cache `~/.npm` (or the runner’s npm cache) keyed on `package-lock.json`. No matrix of Node versions in v1.

## CD jobs (later)

CD is a second workflow or a job `needs: [build]` that is skipped until D8 leaves “local only.”

| Stage | What it does |
|-------|----------------|
| Artifact | Upload `dist/` from the CI build (do not rebuild in CD) |
| Preview | Per-PR URL when a host exists |
| Production | Deploy default-branch `dist/` to the chosen host |

**Not in CD:** Supabase migrations, Edge Functions, Storage bucket setup, seed scripts. Those are a separate ops path when the adapter is real.

Secrets (host token, project id) live in GitHub Environments (`preview`, `production`) when CD is implemented — not in the repo.

## Branch and environment map

```
PR  →  CI  →  (optional preview)
default branch  →  CI  →  (optional production)
```

Protected branch rules (required CI checks) are GitHub settings, not YAML. Turn them on only after the CI workflow is green on a real run.

## Explicit non-goals for the first implementation

- Deploying this prototype’s mock/localStorage app as “production”
- Running CPM on CI as a load test
- E2E against a live Supabase project
- Auto-publishing GitHub Pages unless that is the chosen host
- `npm audit` as a blocking job until the team wants it

## Pivot

Swap the CD target (Vercel, Netlify, Pages, S3) without changing CI jobs. If the package manager changes, update `npm ci` and the cache key in one place. If TypeScript spreads beyond `engine/`, `typecheck` still belongs in CI.

## Implementation gate

Do **not** add `.github/workflows/*` until E10 tickets are pulled. This file is the workflow; YAML is the implementation.
