import assert from "node:assert/strict";
import { AsyncLocalStorage } from "node:async_hooks";

import { describe, test, vi } from "vite-plus/test";
import { z } from "zod";

Reflect.set(globalThis, "AsyncLocalStorage", AsyncLocalStorage);
const { getGitHub } = await import("./github");

describe("GitHub fetching", () => {
  test("GitHub batches searches, caches validated results, and retries failures", async () => {
    const entries = new Map<
      string,
      { isStale: boolean; value: { revalidate: number } }
    >();
    let requests = 0;
    let fail = false;
    let query = "";
    const counts = { issueCount: 42 };
    const payload = {
      data: {
        recent: { ...counts, nodes: [] },
        total: counts,
        upstream: { ...counts, nodes: [] },
        user: {
          contributionsCollection: { contributionCalendar: { weeks: [] } },
          earlierContributions: { contributionCalendar: { weeks: [] } },
        },
        yamada: counts,
        yamadaIssues: counts,
        yamadaReviewed: { issueCount: 17 },
        zen: counts,
        zenReviewed: { issueCount: 9 },
      },
    };
    vi.stubGlobal("__incrementalCache", {
      generateSimpleCacheKey: (key: string) => key,
      get: (key: string) => entries.get(key),
      set: (key: string, value: { revalidate: number }) => {
        assert.equal(value.revalidate, 3600);
        entries.set(key, { isStale: false, value });
      },
    });
    vi.stubEnv("GITHUB_TOKEN", "test-token");
    vi.spyOn(globalThis, "fetch").mockImplementation(async (_url, init) => {
      requests += 1;
      const body = z.string().parse(init?.body);
      ({ query } = z.object({ query: z.string() }).parse(JSON.parse(body)));
      return await Promise.resolve(
        Response.json(fail ? { errors: [{ message: "Unavailable" }] } : payload)
      );
    });

    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-09-28T12:00:00Z"));

    try {
      const first = await getGitHub();
      assert.equal(first.total, 42);
      assert.ok(query.includes('author:taroj1205 is:pr is:merged is:public"'));
      assert.equal(first.projects.yamadaReviewed, 17);
      assert.equal(first.projects.zenReviewed, 9);
      assert.equal("hazumi" in first.projects, false);
      assert.equal(query.includes("hazumi: search"), false);
      assert.equal(first.monthly.length, 13);
      assert.equal(first.monthly[0]?.month, "2025-09");
      assert.equal(first.monthly.at(-1)?.month, "2026-09");
      assert.ok(query.includes('from: "2025-09-29T00:00:00.000Z"'));
      assert.ok(
        query.includes(
          'earlierContributions: contributionsCollection(from: "2025-09-01T00:00:00.000Z", to: "2025-09-28T23:59:59.999Z")'
        )
      );
      assert.deepEqual(first.recent, []);
      assert.deepEqual(await getGitHub(), first);
      assert.equal(
        requests,
        1,
        "Repeated calls should reuse the GitHub result"
      );
      assert.equal(query.match(/search\(type: ISSUE/gu)?.length, 8);
      for (const org of ["yamada-ui", "zen-browser"]) {
        assert.ok(
          query.includes(
            `is:pr is:public reviewed-by:taroj1205 -author:taroj1205 org:${org}`
          )
        );
      }
      assert.equal(query.match(/nodes\s*\{/gu)?.length, 2);

      entries.clear();
      vi.mocked(fetch).mockResolvedValueOnce(
        Response.json({
          data: {
            ...payload.data,
            recent: { ...counts, nodes: [null] },
            upstream: { ...counts, nodes: [null] },
          },
          errors: ["recent", "upstream"].map((field) => ({
            message: "Organization forbids access with this token",
            path: [field, "nodes", 0],
            type: "FORBIDDEN",
          })),
        })
      );
      const restricted = await getGitHub();
      assert.equal(restricted.total, 42);
      assert.deepEqual(restricted.recent, []);
      assert.deepEqual(restricted.upstream, []);
      assert.deepEqual(await getGitHub(), restricted);

      entries.clear();
      fail = true;
      await assert.rejects(getGitHub(), /Unavailable/u);
      assert.equal(entries.size, 0, "GraphQL errors must not enter the cache");
      fail = false;
      vi.mocked(fetch).mockResolvedValueOnce(
        Response.json({ ...payload, errors: [{ message: "Partial results" }] })
      );
      await assert.rejects(getGitHub(), /GitHub query failed/u);
      assert.equal(entries.size, 0, "Partial results must not enter the cache");
      const failures: Promise<void>[] = [];
      for (const error of [
        { type: "FORBIDDEN", path: ["total"] },
        { type: "FORBIDDEN", path: ["recent"] },
        { type: "FORBIDDEN", path: ["user", "contributionsCollection"] },
        { type: "INTERNAL", path: ["recent", "nodes", 0] },
      ]) {
        vi.mocked(fetch).mockResolvedValueOnce(
          Response.json({
            ...payload,
            errors: [{ ...error, message: "Query failed" }],
          })
        );
        failures.push(assert.rejects(getGitHub(), /Query failed/u));
      }
      await Promise.all(failures);
      assert.equal(entries.size, 0);
      const retried = await getGitHub();
      assert.equal(retried.total, 42);
      assert.equal(requests, 3);

      const checkRange = async (
        today: string,
        start: string,
        before: string,
        end: string
      ) => {
        entries.clear();
        vi.setSystemTime(new Date(`${today}T12:00:00Z`));
        vi.mocked(fetch).mockImplementationOnce(async (_url, init) => {
          const body = z.string().parse(init?.body);
          assert.ok(body.includes(`${start}T00:00:00.000Z`));
          return await Promise.resolve(
            Response.json({
              ...payload,
              data: {
                ...payload.data,
                user: {
                  earlierContributions: {
                    contributionCalendar: {
                      weeks: [
                        {
                          contributionDays: [
                            {
                              date: `${before.slice(0, 7)}-01`,
                              contributionCount: 7,
                            },
                            { date: before, contributionCount: 100 },
                            { date: start, contributionCount: 2 },
                          ],
                        },
                      ],
                    },
                  },
                  contributionsCollection: {
                    contributionCalendar: {
                      weeks: [
                        {
                          contributionDays: [
                            { date: before, contributionCount: 100 },
                            { date: start, contributionCount: 2 },
                            { date: today, contributionCount: 3 },
                            { date: end, contributionCount: 100 },
                          ],
                        },
                      ],
                    },
                  },
                },
              },
            })
          );
        });
        const result = await getGitHub();
        assert.equal(result.monthly.length, 13);
        assert.equal(
          result.monthly.reduce((sum, month) => sum + month.contributions, 0),
          112
        );
        assert.equal(result.contributionTotal, 5);
      };
      await checkRange("2026-09-28", "2025-09-29", "2025-09-28", "2026-09-29");
      await checkRange("2024-02-29", "2023-03-01", "2023-02-28", "2024-03-01");
      await checkRange("2025-02-28", "2024-02-29", "2024-02-28", "2025-03-01");
      await checkRange("2026-01-01", "2025-01-02", "2025-01-01", "2026-01-02");
    } finally {
      vi.useRealTimers();
      vi.restoreAllMocks();
      vi.unstubAllEnvs();
      vi.unstubAllGlobals();
    }
  });
});
