import assert from "node:assert/strict";

import { describe, it } from "vite-plus/test";

import { renderReport } from "./bundle-report";

describe("bundle report", () => {
  it("lists changed routes and folds unchanged ones away", () => {
    const report = renderReport(
      {
        routes: { "/": 100_000, "/games": 200_000, "/old": 5000 },
        totals: { "All JS": 1_500_000 },
      },
      {
        routes: { "/": 100_000, "/games": 210_000, "/new": 900 },
        totals: { "All JS": 1_500_000 },
      }
    );

    assert.ok(report.startsWith("<!-- bundle-report -->\n"));
    assert.match(
      report,
      /\| `All JS` \| 1\.50 MB \| 1\.50 MB \| no change \|/u
    );

    const [changed, unchanged] = report.split("<details>");
    assert.match(
      changed,
      /\| `\/games` \| 200\.0 kB \| 210\.0 kB \| \+10\.0 kB \(\+5\.0%\) \|/u
    );
    assert.match(changed, /\| `\/new` \| - \| 900 B \| new \|/u);
    assert.match(changed, /\| `\/old` \| 5\.0 kB \| - \| removed \|/u);
    assert.doesNotMatch(changed, /\| `\/` \|/u);
    assert.match(unchanged, /Unchanged routes \(1\)/u);
    assert.match(
      unchanged,
      /\| `\/` \| 100\.0 kB \| 100\.0 kB \| no change \|/u
    );
  });
});
