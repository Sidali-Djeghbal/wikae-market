#!/usr/bin/env node
// index.json is generated. Fail when an entry that already exists in the committed index
// changed without the index being regenerated. New entries are allowed; CI indexes them after merge.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { isDeepStrictEqual } from "node:util";

const ref = process.argv[2] || "HEAD";
let committed;
try {
  committed = JSON.parse(execFileSync("git", ["show", `${ref}:index.json`], { encoding: "utf8" }));
} catch {
  console.error(`could not read index.json from ${ref}`);
  process.exit(1);
}
const current = JSON.parse(readFileSync("index.json", "utf8"));
if (committed.etude !== current.etude || committed.repo !== current.repo) {
  console.error(`index.json header changed: ${current.etude} ${current.repo}`);
  process.exit(1);
}
const byPath = new Map(current.entries.map((e) => [e.path, e]));
const stale = committed.entries.filter((e) => {
  const now = byPath.get(e.path);
  return !now || !isDeepStrictEqual(now, e);
});
if (stale.length) {
  console.error(`index.json is stale for: ${stale.map((e) => e.path).join(", ")}`);
  console.error("Run `wikae market index .` and commit index.json.");
  process.exit(1);
}
console.log(`index.json is current for ${committed.entries.length} existing entries`);
