// GITHUB_TOKEN needs read access to Hazumi's private repos for the totals and
// the contribution graph to include work there.
import { unstable_cache } from "next/cache";
import { z } from "zod";

const USER = "taroj1205";
const MERGED = `author:${USER} is:pr is:merged`;
const PUBLIC_OTHERS = `${MERGED} is:public -user:${USER}`;
const REVIEWED = `is:pr is:public reviewed-by:${USER} -author:${USER}`;
// Where I'm a member or maintainer. Anything else counts as upstream.
const HOME_ORGS = ["zen-browser", "yamada-ui", "Hazumi-Inc", "UoaWDCC"];
const UPSTREAM_MIN_STARS = 500;

const searches = {
  recent: [`${PUBLIC_OTHERS} sort:updated-desc`, 100],
  total: [MERGED, 0],
  upstream: [
    `${PUBLIC_OTHERS} ${HOME_ORGS.map((org) => `-org:${org}`).join(" ")}`,
    100,
  ],
  yamada: [`${MERGED} org:yamada-ui`, 0],
  yamadaIssues: [`author:${USER} is:issue org:yamada-ui`, 0],
  yamadaReviewed: [`${REVIEWED} org:yamada-ui`, 0],
  zen: [`${MERGED} org:zen-browser`, 0],
  zenReviewed: [`${REVIEWED} org:zen-browser`, 0],
} as const;

const pullRequest = z
  .object({
    mergedAt: z.string(),
    number: z.number(),
    repository: z.object({
      nameWithOwner: z.string(),
      stargazerCount: z.number(),
    }),
    title: z.string(),
    url: z.string(),
  })
  .transform(({ repository, ...pr }) => ({
    ...pr,
    repo: repository.nameWithOwner,
    stars: repository.stargazerCount,
  }));

const count = z.object({ issueCount: z.number() });

const inaccessiblePullRequest = z.object({
  type: z.literal("FORBIDDEN"),
  path: z.tuple([
    z.enum(["recent", "upstream"]),
    z.literal("nodes"),
    z.number().int().nonnegative(),
  ]),
});

const search = count.extend({
  // Results the token can't read come back as null.
  nodes: z
    .array(pullRequest.nullable())
    .transform((nodes) => nodes.filter((pr) => pr !== null)),
});

const contributionCollection = z.object({
  contributionCalendar: z.object({
    weeks: z.array(
      z.object({
        contributionDays: z.array(
          z.object({ contributionCount: z.number(), date: z.string() })
        ),
      })
    ),
  }),
});

const response = z.object({
  data: z.object({
    recent: search,
    total: count,
    upstream: search,
    user: z.object({
      contributionsCollection: contributionCollection,
      earlierContributions: contributionCollection,
    }),
    yamada: count,
    yamadaIssues: count,
    yamadaReviewed: count,
    zen: count,
    zenReviewed: count,
  }),
});

type PullRequest = z.infer<typeof pullRequest>;

const byMergedAt = (a: PullRequest, b: PullRequest) =>
  b.mergedAt.localeCompare(a.mergedAt);

const fetchGitHub = async () => {
  const token = process.env.GITHUB_TOKEN ?? "";
  if (token === "") {
    throw new Error(
      "GITHUB_TOKEN is not set. Try: GITHUB_TOKEN=$(gh auth token) bun dev"
    );
  }

  const now = new Date();
  const from = new Date(
    Date.UTC(now.getUTCFullYear() - 1, now.getUTCMonth(), now.getUTCDate())
  );
  if (from.getUTCMonth() !== now.getUTCMonth()) {
    from.setUTCDate(0);
  }
  from.setUTCDate(from.getUTCDate() + 1);
  const graphFrom = new Date(
    Date.UTC(now.getUTCFullYear() - 1, now.getUTCMonth(), 1)
  );
  const earlierTo = new Date(from.getTime() - 1);
  const firstDay = from.toISOString().slice(0, 10);
  const lastDay = now.toISOString().slice(0, 10);
  const query = `{
    ${Object.entries(searches)
      .map(
        ([key, [q, first]]) =>
          `${key}: search(type: ISSUE, first: ${first}, query: ${JSON.stringify(q)}) {
            issueCount
            ${first > 0 ? "nodes { ... on PullRequest { number title url mergedAt repository { nameWithOwner stargazerCount } } }" : ""}
          }`
      )
      .join("\n")}
    user(login: "${USER}") {
      earlierContributions: contributionsCollection(from: "${graphFrom.toISOString()}", to: "${earlierTo.toISOString()}") {
        contributionCalendar { weeks { contributionDays { date contributionCount } } }
      }
      contributionsCollection(from: "${from.toISOString()}", to: "${now.toISOString()}") {
        contributionCalendar { weeks { contributionDays { date contributionCount } } }
      }
    }
  }`;

  const res = await fetch("https://api.github.com/graphql", {
    body: JSON.stringify({ query }),
    headers: { authorization: `bearer ${token}` },
    method: "POST",
  });
  if (!res.ok) {
    throw new Error(`GitHub query failed: ${res.status} ${res.statusText}`);
  }
  const payload: unknown = await res.json();
  const { errors } = z
    .object({
      errors: z
        .array(
          z.object({
            message: z.string(),
            type: z.string().optional(),
            path: z.array(z.union([z.string(), z.number()])).optional(),
          })
        )
        .optional(),
    })
    .parse(payload);
  const failures =
    errors?.filter(
      (error) => !inaccessiblePullRequest.safeParse(error).success
    ) ?? [];
  if (failures.length > 0) {
    throw new Error(
      `GitHub query failed: ${failures.map(({ message }) => message).join("; ")}`
    );
  }
  const { data } = response.parse(payload);

  const monthly = new Map<string, number>();
  for (let i = 0; i < 13; i += 1) {
    const month = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 12 + i)
    );
    monthly.set(month.toISOString().slice(0, 7), 0);
  }
  let contributionTotal = 0;
  for (const [collection, start, end] of [
    [
      data.user.earlierContributions,
      graphFrom.toISOString().slice(0, 10),
      earlierTo.toISOString().slice(0, 10),
    ],
    [data.user.contributionsCollection, firstDay, lastDay],
  ] as const) {
    for (const week of collection.contributionCalendar.weeks) {
      for (const day of week.contributionDays) {
        if (day.date < start || day.date > end) {
          continue;
        }
        const key = day.date.slice(0, 7);
        const current = monthly.get(key);
        if (current !== undefined) {
          monthly.set(key, current + day.contributionCount);
        }
        if (day.date >= firstDay) {
          contributionTotal += day.contributionCount;
        }
      }
    }
  }

  const upstream = new Map<string, PullRequest[]>();
  for (const pr of data.upstream.nodes.toSorted(byMergedAt)) {
    if (pr.stars >= UPSTREAM_MIN_STARS) {
      upstream.set(pr.repo, [...(upstream.get(pr.repo) ?? []), pr]);
    }
  }

  return {
    contributionTotal,
    monthly: [...monthly].map(([month, contributions]) => ({
      contributions,
      month,
    })),
    projects: {
      yamada: data.yamada.issueCount,
      yamadaIssues: data.yamadaIssues.issueCount,
      yamadaReviewed: data.yamadaReviewed.issueCount,
      zen: data.zen.issueCount,
      zenReviewed: data.zenReviewed.issueCount,
    },
    recent: data.recent.nodes.toSorted(byMergedAt).slice(0, 12),
    total: data.total.issueCount,
    updatedAt: now.toISOString(),
    upstream: [...upstream].map(([repo, prs]) => ({ prs, repo })),
  };
};

// Cache only validated results. Keeping the clock inside the callback gives
// every caller the same hourly snapshot without a new timestamped request.
export const getGitHub = unstable_cache(
  fetchGitHub,
  [USER, JSON.stringify(searches), String(UPSTREAM_MIN_STARS)],
  { revalidate: 3600 }
);

export type GitHub = Awaited<ReturnType<typeof getGitHub>>;
