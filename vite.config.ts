import fmt from "ultracite/oxfmt";
import antiSlop from "ultracite/oxlint/anti-slop";
import core from "ultracite/oxlint/core";
import next from "ultracite/oxlint/next";
import react from "ultracite/oxlint/react";
import shadcn from "ultracite/oxlint/shadcn";
import tanstack from "ultracite/oxlint/tanstack";
import vitest from "ultracite/oxlint/vitest";
import { defineConfig } from "vite-plus";

export default defineConfig({
  fmt,
  lint: {
    extends: [core, react, next, shadcn, tanstack, vitest, antiSlop],
    ignorePatterns: core.ignorePatterns,
    jsPlugins: [{ name: "shadcn", specifier: "@shadcn/lint" }],
    options: { typeAware: true, typeCheck: true },
  },
});
