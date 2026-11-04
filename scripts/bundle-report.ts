import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { gzipSync } from "node:zlib";

import { z } from "zod";

type Sizes = Record<string, number>;

interface Build {
  routes: Sizes;
  totals: Sizes;
}

const routeBundleStats = z.array(
  z.object({ firstLoadChunkPaths: z.array(z.string()), route: z.string() })
);

const buildManifest = z.object({ rootMainFiles: z.array(z.string()) });

const readJson = <T>(schema: z.ZodType<T>, file: string) =>
  schema.parse(JSON.parse(readFileSync(file, "utf-8")));

const filesIn = (dir: string) =>
  readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => path.join(entry.parentPath, entry.name));

const measure = (dir: string): Build => {
  const gzipped = new Map<string, number>();

  const gzip = (file: string) => {
    const size = gzipped.get(file) ?? gzipSync(readFileSync(file)).length;

    gzipped.set(file, size);

    return size;
  };

  const sum = (files: string[], size = gzip) =>
    files.reduce((total, file) => total + size(file), 0);

  const routes = readJson(
    routeBundleStats,
    path.join(dir, ".next/diagnostics/route-bundle-stats.json")
  );

  const { rootMainFiles } = readJson(
    buildManifest,
    path.join(dir, ".next/build-manifest.json")
  );

  const chunks = filesIn(path.join(dir, ".next/static/chunks"));

  return {
    routes: Object.fromEntries(
      routes.map(({ route, firstLoadChunkPaths }) => [
        route,
        sum(firstLoadChunkPaths.map((file) => path.join(dir, file))),
      ])
    ),
    totals: {
      "All CSS": sum(chunks.filter((file) => file.endsWith(".css"))),
      "All JS": sum(chunks.filter((file) => file.endsWith(".js"))),
      "JS shared by every route": sum(
        rootMainFiles.map((file) => path.join(dir, ".next", file))
      ),
      "Static media (raw)": sum(
        filesIn(path.join(dir, ".next/static/media")),
        (file) => statSync(file).size
      ),
    },
  };
};

const formatBytes = (bytes: number) => {
  if (bytes < 1000) {
    return `${bytes} B`;
  }

  if (bytes < 1_000_000) {
    return `${(bytes / 1000).toFixed(1)} kB`;
  }

  return `${(bytes / 1_000_000).toFixed(2)} MB`;
};

const cell = (sizes: Sizes, name: string) =>
  Object.hasOwn(sizes, name) ? formatBytes(sizes[name]) : "-";

const formatChange = (base: Sizes, head: Sizes, name: string) => {
  if (!Object.hasOwn(base, name)) {
    return "new";
  }

  if (!Object.hasOwn(head, name)) {
    return "removed";
  }

  const diff = head[name] - base[name];

  if (diff === 0) {
    return "no change";
  }

  const sign = diff > 0 ? "+" : "-";

  const percent =
    base[name] === 0
      ? ""
      : ` (${sign}${Math.abs((diff / base[name]) * 100).toFixed(1)}%)`;

  return `${sign}${formatBytes(Math.abs(diff))}${percent}`;
};

const table = (base: Sizes, head: Sizes, names: string[]) =>
  [
    "| | Base | This PR | Change |",
    "| --- | ---: | ---: | ---: |",
    ...names.map(
      (name) =>
        `| \`${name}\` | ${cell(base, name)} | ${cell(head, name)} | ${formatChange(base, head, name)} |`
    ),
  ].join("\n");

export const renderReport = (base: Build, head: Build) => {
  const routes = [
    ...new Set([...Object.keys(base.routes), ...Object.keys(head.routes)]),
  ].toSorted();

  const changed = routes.filter(
    (route) => base.routes[route] !== head.routes[route]
  );

  const unchanged = routes.filter((route) => !changed.includes(route));

  return [
    "<!-- bundle-report -->",
    "## Bundle size",
    "",
    "Gzipped JS and CSS from `next build`, comparing the base branch with this PR. Static media is the raw size of the fonts and images in `.next/static/media`.",
    "",
    table(base.totals, head.totals, Object.keys(head.totals)),
    "",
    "### First-load JS per route",
    "",
    changed.length === 0
      ? "No route changed."
      : table(base.routes, head.routes, changed),
    ...(unchanged.length === 0
      ? []
      : [
          "",
          `<details><summary>Unchanged routes (${unchanged.length})</summary>`,
          "",
          table(base.routes, head.routes, unchanged),
          "",
          "</details>",
        ]),
    "",
  ].join("\n");
};

if (import.meta.main) {
  const [base, head] = process.argv.slice(2);

  if (!(base && head)) {
    throw new Error(
      "Usage: bun scripts/bundle-report.ts <base dir> <head dir>"
    );
  }

  process.stdout.write(renderReport(measure(base), measure(head)));
}
