import { describe, it, expect } from "bun:test";
import { createRequire } from "node:module";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

// Regression guard for the "standard install -> dev server crashes / hydration
// 500s site-wide" bugs.
//
// (1) Node enforces `exports`: a package with an `exports` map can only resolve
//     the subpaths it declares. The dev server resolves capstan-react's package
//     root to find its `dist`, so capstan-react MUST export "./package.json" or
//     `createRequire().resolve("@zauso-ai/capstan-react/package.json")` throws
//     ERR_PACKAGE_PATH_NOT_EXPORTED and dev startup crashes under a real npm
//     install. (Bun is lenient about this, which is why a Bun-only test missed
//     it the first time — hence the explicit structural assertion below.)
// (2) The entries the dev server bundles must exist in the published `dist`
//     (capstan-react ships only dist: `files` is ["dist"]).

const reactPkgPath = createRequire(import.meta.url).resolve(
  "@zauso-ai/capstan-react/package.json",
);
const reactRoot = path.dirname(reactPkgPath);

describe("capstan-react packaging (npm-install layout)", () => {
  it("exports ./package.json so its root is resolvable under Node strict exports", () => {
    const pkg = JSON.parse(readFileSync(reactPkgPath, "utf8")) as {
      exports?: Record<string, unknown>;
    };
    expect(pkg.exports?.["./package.json"]).toBe("./package.json");
  });

  for (const entry of ["browser.js", "client/index.js", "client/entry.js", "hydrate.js"]) {
    it(`ships dist/${entry}`, () => {
      expect(existsSync(path.join(reactRoot, "dist", entry))).toBe(true);
    });
  }
});
