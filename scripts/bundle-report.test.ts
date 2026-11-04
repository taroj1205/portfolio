import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { gzipSync } from "node:zlib";

import { describe, it } from "vite-plus/test";

import { measure, renderReport } from "./bundle-report";

describe("bundle report", () => {
  it("lists changed routes and folds unchanged ones away", () => {
    const report = renderReport(
      {
        routes: { "/": 100_000, "/games": 200_000, "/old": 5000 },
        totals: { "All JS": 1_500_000 },
      },
      {
        routes: { "/": 100_000, "/games": 210_000, "/new": 900 },
        totals: { "All JS": 1_520_000 },
      }
    );

    assert.ok(report.startsWith("<!-- bundle-report -->\n"));
    assert.match(
      report,
      /\| `All JS` \| 1\.50 MB \| 1\.52 MB \| \+20\.0 kB \(\+1\.3%\) \|/u
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

  it("measures gzipped chunks and the JS every route shares", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "bundle-report-"));

    const files = {
      ".next/diagnostics/route-bundle-stats.json": JSON.stringify([
        {
          firstLoadChunkPaths: [
            ".next/static/chunks/framework.js",
            ".next/static/chunks/home.js",
          ],
          route: "/",
        },
        {
          firstLoadChunkPaths: [
            ".next/static/chunks/framework.js",
            ".next/static/chunks/games.js",
          ],
          route: "/games",
        },
      ]),
      ".next/static/chunks/framework.js": "react();".repeat(500),
      ".next/static/chunks/games.js": "games();".repeat(200),
      ".next/static/chunks/home.js": "home();".repeat(100),
      ".next/static/chunks/site.css": "a{color:red}".repeat(50),
      ".next/static/media/font.woff2": "x".repeat(1234),
    };

    const gzip = (file: keyof typeof files) => gzipSync(files[file]).length;

    try {
      for (const [file, contents] of Object.entries(files)) {
        mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
        writeFileSync(path.join(dir, file), contents);
      }

      const { routes, totals } = measure(dir);
      const framework = gzip(".next/static/chunks/framework.js");

      assert.deepEqual(routes, {
        "/": framework + gzip(".next/static/chunks/home.js"),
        "/games": framework + gzip(".next/static/chunks/games.js"),
      });
      assert.deepEqual(totals, {
        "All CSS": gzip(".next/static/chunks/site.css"),
        "All JS":
          framework +
          gzip(".next/static/chunks/games.js") +
          gzip(".next/static/chunks/home.js"),
        "JS shared by every route": framework,
        "Static media (raw)": 1234,
      });
      assert.notEqual(
        framework,
        files[".next/static/chunks/framework.js"].length
      );
    } finally {
      rmSync(dir, { force: true, recursive: true });
    }
  });
});
