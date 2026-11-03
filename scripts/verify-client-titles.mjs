/**
 * Cross-checks the client-supplied title list against what the original site
 * ACTUALLY serves for each URL. Mismatches are REPORTED, never reconciled by
 * guessing — the site content always follows the original, not the list.
 *
 * Run: cmd /c "node scripts/verify-client-titles.mjs"
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const cap = JSON.parse(
  readFileSync(join(root, "content", "original", "rendered", "captured-50.json"), "utf8"),
);
const capById = Object.fromEntries(cap.map((c) => [c.id, c]));

const lines = readFileSync(join(root, "content", "original", "client-supplied-titles.txt"), "utf8")
  .split(/\r?\n/)
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith("#"));

const supplied = lines.map((l) => {
  const i = l.indexOf("\t");
  return { id: l.slice(0, i), title: l.slice(i + 1) };
});

/** Displayed title = line 6 (1-based) of the captured page text. */
function displayedTitle(id) {
  const c = capById[id];
  if (!c) return null;
  return c.text.split("\n")[5];
}

let match = 0;
const mismatches = [];
const missing = [];

for (const s of supplied) {
  const actual = displayedTitle(s.id);
  if (actual === null) { missing.push(s.id); continue; }
  if (actual === s.title) { match++; continue; }
  mismatches.push({ id: s.id, supplied: s.title, actual });
}

console.log(`Client-supplied titles : ${supplied.length}`);
console.log(`Captured pages        : ${cap.length}`);
console.log(`Exact match           : ${match}`);
console.log(`Mismatch              : ${mismatches.length}`);
console.log(`No captured page      : ${missing.length}`);
if (missing.length) console.log(`   missing ids: ${missing.join(", ")}`);

if (mismatches.length) {
  console.log(`\n=== MISMATCHES (original site content wins; list not applied) ===`);
  for (const m of mismatches) {
    console.log(`\n  id ${m.id}`);
    console.log(`    client list : ${m.supplied}`);
    console.log(`    original    : ${m.actual}`);
  }
}

// Also report any captured page NOT in the client list.
const suppliedIds = new Set(supplied.map((s) => s.id));
const extra = cap.filter((c) => !suppliedIds.has(c.id)).map((c) => c.id);
if (extra.length) console.log(`\nCaptured but not in client list: ${extra.join(", ")}`);

process.exit(mismatches.length || missing.length ? 1 : 0);
