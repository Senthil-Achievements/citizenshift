/**
 * Full analysis of the client-supplied title list vs the original site.
 * Produces the evidence for docs/content-fidelity-report.md.
 *
 * Categories:
 *   A. exact match
 *   B. differs only by a trailing period (punctuation, still a difference)
 *   C. URL serves a DIFFERENT bill than the list claims
 *   D. client title not present at ANY of the 50 URLs
 *
 * Run: cmd /c "node scripts/analyse-title-mismatch.mjs"
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const cap = JSON.parse(readFileSync(join(root, "content/original/rendered/captured-50.json"), "utf8"));
const capById = Object.fromEntries(cap.map((c) => [c.id, c]));

const supplied = readFileSync(join(root, "content/original/client-supplied-titles.txt"), "utf8")
  .split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith("#"))
  .map((l) => { const i = l.indexOf("\t"); return { id: l.slice(0, i), title: l.slice(i + 1) }; });

const displayed = (id) => capById[id]?.text.split("\n")[5] ?? null;
const norm = (s) => s.replace(/[.\s]+$/, "");

const A = [], B = [], C = [];
const siteTitles = new Map(); // normalised site title -> id
for (const c of cap) siteTitles.set(norm(c.text.split("\n")[5]), c.id);

for (const s of supplied) {
  const actual = displayed(s.id);
  if (actual === s.title) A.push(s.id);
  else if (norm(actual) === norm(s.title)) B.push(s.id);
  else C.push({ id: s.id, supplied: s.title, actual });
}

// client titles with no counterpart anywhere on the site
const D = supplied.filter((s) => !siteTitles.has(norm(s.title)));

// site titles the client never mentioned
const suppliedNorm = new Set(supplied.map((s) => norm(s.title)));
const E = cap.filter((c) => !suppliedNorm.has(norm(c.text.split("\n")[5])))
  .map((c) => ({ id: c.id, title: c.text.split("\n")[5] }));

console.log(`A. exact match                    : ${A.length}`);
console.log(`B. differs only by trailing period : ${B.length}  (${B.join(", ")})`);
console.log(`C. URL serves a different bill     : ${C.length}`);
console.log(`D. client title absent from site   : ${D.length}`);
console.log(`E. site title absent from list     : ${E.length}`);

if (C.length) {
  console.log(`\n=== C. URL serves a DIFFERENT bill than the list claims ===`);
  for (const m of C) {
    console.log(`\n  ${m.id}`);
    console.log(`    list says  : ${m.supplied}`);
    console.log(`    site has   : ${m.actual}`);
  }
}
if (D.length) {
  console.log(`\n=== D. client titles not found at ANY of the 50 URLs ===`);
  for (const d of D) console.log(`  ${d.id}  ${d.title}`);
}
if (E.length) {
  console.log(`\n=== E. titles the site serves that the list never mentions ===`);
  for (const e of E) console.log(`  ${e.id}  ${e.title}`);
}
