/**
 * diff-rendered-links.mjs — verifies every ORIGINAL link on each page is
 * present and unchanged in the rebuild, and the ONLY addition is the adapted
 * internal "Back to Feed" navigation link (/explore).
 *
 *   cmd /c "node scripts/diff-rendered-links.mjs content/rebuild/rebuild-links-50.json"
 *
 * Targets: content/original/rendered/captured-50.json (never modified).
 * Exits 1 on any removed, changed or unexpected-external link.
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const ours = JSON.parse(
  readFileSync(join(root, process.argv[2] ?? "content/rebuild/rebuild-links-50.json"), "utf8"),
);
const cap = JSON.parse(
  readFileSync(join(root, "content/original/rendered/captured-50.json"), "utf8"),
);
const target = new Map(cap.map((c) => [c.id, c]));

let ok = 0;
const failures = [];
let internalBack = 0;
let nonHttps = 0;

for (const o of ours) {
  const t = target.get(o.id);
  if (!t) {
    failures.push(`${o.id}: not in authoritative capture`);
    continue;
  }
  const issues = [];

  // 1. Every ORIGINAL link (text+href pair) must exist unchanged in the rebuild.
  for (const tl of t.links) {
    const found = o.links.some((l) => l.href === tl.href && l.text === tl.text);
    if (!found) {
      issues.push(`missing/changed original link: ${JSON.stringify(tl)}`);
    }
  }

  // 2. Additions allowed: only the adapted internal back-navigation link.
  for (const l of o.links) {
    if (t.links.some((tl) => tl.href === l.href && tl.text === l.text)) continue;
    const isBack =
      l.text === "Back to Feed" &&
      (l.href === "/explore" || l.href === "/explore#legislation");
    if (isBack) {
      internalBack += 1;
      continue;
    }
    issues.push(`unexpected extra link: ${JSON.stringify(l)}`);
  }

  // 3. All external links must remain https and unchanged
  for (const l of o.links) {
    if (l.href.startsWith("/")) continue;
    if (!/^https:\/\//.test(l.href)) {
      nonHttps += 1;
      issues.push(`non-https link: ${l.href}`);
    }
  }

  if (issues.length) failures.push(`${o.id}: ${issues.length} issue(s)\n  - ${issues.join("\n  - ")}`);
  else ok += 1;
}

console.log(`compared ${ours.length} rebuilt page(s): ${ok} clean, ${failures.length} with issues`);
console.log(`adapted internal "Back to Feed" links: ${internalBack} (all other links unchanged)`);
console.log(`non-https additions: ${nonHttps}`);
for (const f of failures) console.log(`  ISSUES ${f}`);
process.exit(failures.length ? 1 : 0);
