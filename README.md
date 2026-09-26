# Portfolio

My personal site: Next.js 16 (App Router), StyleX, Bun, and Vite+ with Ultracite for formatting, linting and type checks.

## Running it

```sh
bun install
GITHUB_TOKEN=$(gh auth token) bun dev
```

The home page reads GitHub when it renders, so it needs `GITHUB_TOKEN`. Put it in `.env` or pass it for one command as above.

## How the numbers stay current

`src/lib/github.ts` makes one GraphQL request for merged PR counts, the last 12 months of contributions, recent merges, and merged PRs in popular repos I don't help run. The home page sets `revalidate = 3600`. Next serves the cached page and rebuilds it in the background at most once an hour (ISR), so nothing needs a redeploy. If GitHub fails, the error keeps the last good page instead of showing zeros.

The token only counts what it can read, so the totals, the contribution chart and the work counts can come out lower with a narrower token. A fine-grained token also gets `null` for PRs in orgs that block those tokens. Those PRs drop out of the recently merged list, so the query asks for 100 to leave enough readable ones.

## Checks

```sh
bunx vp check    # oxfmt, oxlint (Ultracite presets) and TypeScript
bunx vp test run
bun run knip     # unused files, exports and dependencies
bun run spell    # cspell
bun run build
```

CI runs these checks on every pull request (`.github/workflows/ci.yml`).

CI also runs actionlint, zizmor, and pinact in parallel to check workflow syntax, security, and pinned actions.
