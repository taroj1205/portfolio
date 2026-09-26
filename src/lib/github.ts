// GITHUB_TOKEN needs read access to Hazumi's private repos for the totals and
// the contribution graph to include work there.
import { unstable_cache } from "next/cache";
import { z } from "zod";

const USER = "taroj1205";
const MERGED = `author:${USER} is:pr is:merged`;
const PUBLIC_OTHERS = `${MERGED} is:public -user:${USER}`;
// Where I'm a member or maintainer. Anything else counts as upstream.
const HOME_ORGS = ["zen-browser", "yamada-ui", "Hazumi-Inc", "UoaWDCC"];
const UPSTREAM_MIN_STARS = 500;

const searches = {
  hazumi: [`${MERGED} org:Hazumi-Inc`, 0],
  recent: [`${PUBLIC_OTHERS} sort:updated-desc`, 100],
  total: [MERGED, 0],
  upstream: [
    `${PUBLIC_OTHERS} ${HOME_ORGS.map((org) => `-org:${org}`).join(" ")}`,
    100,
  ],
  yamada: [`${MERGED} org:yamada-ui`, 0],
  yamadaIssues: [`author:${USER} is:issue org:yamada-ui`, 0],
  zen: [`${MERGED} org:zen-browser`, 0],
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

const response = z.object({
  data: z.object({
    hazumi: count,
    recent: search,
    total: count,
    upstream: search,
    user: z.object({
      contributionsCollection: z.object({
        contributionCalendar: z.object({
          weeks: z.array(
            z.object({
              contributionDays: z.array(
                z.object({ contributionCount: z.number(), date: z.string() })
              ),
            })
          ),
        }),
      }),
    }),
    yamada: count,
    yamadaIssues: count,
    zen: count,
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
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11, 1)
  );
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
  for (let i = 0; i < 12; i += 1) {
    const month = new Date(
      Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + i)
    );
    monthly.set(month.toISOString().slice(0, 7), 0);
  }
  for (const week of data.user.contributionsCollection.contributionCalendar
    .weeks) {
    for (const day of week.contributionDays) {
      const key = day.date.slice(0, 7);
      const current = monthly.get(key);
      if (current !== undefined) {
        monthly.set(key, current + day.contributionCount);
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
    monthly: [...monthly].map(([month, contributions]) => ({
      contributions,
      month,
    })),
    projects: {
      hazumi: data.hazumi.issueCount,
      yamada: data.yamada.issueCount,
      yamadaIssues: data.yamadaIssues.issueCount,
      zen: data.zen.issueCount,
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
