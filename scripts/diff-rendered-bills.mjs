/**
 * diff-rendered-bills.mjs — byte-exact comparison of the REBUILT page's
 * captured innerText against the machine-captured original.
 *
 *   cmd /c "node scripts/diff-rendered-bills.mjs content/rebuild/rebuild-capture-50.json"
 *
 * The rebuild capture (array of { id, url, text }) is produced by the browser
 * DOM capture of OUR server — never hand-typed. The authoritative target is
 * content/original/rendered/captured-50.json, which must not be modified.
 *
 * Exits 1 on any difference, printing the first divergent character per page.
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const captureArg = process.argv[2] ?? "content/rebuild/rebuild-capture-50.json";
const ours = JSON.parse(readFileSync(join(root, captureArg), "utf8"));
const cap = JSON.parse(
  readFileSync(join(root, "content/original/rendered/captured-50.json"), "utf8"),
);
const target = new Map(cap.map((c) => [c.id, c]));

let ok = 0;
const failures = [];
for (const o of ours) {
  const t = target.get(o.id);
  if (!t) {
    failures.push(`${o.id}: not in authoritative capture`);
    continue;
  }
  if (o.text === t.text) {
    ok += 1;
    continue;
  }
  const a = t.text;
  const b = o.text;
  let i = 0;
  while (i < Math.min(a.length, b.length) && a[i] === b[i]) i++;
  failures.push(
    `${o.id}: ours=${b.length} chars, original=${a.length} chars, ` +
      `first difference at char ${i}\n` +
      `    original: ${JSON.stringify(a.slice(Math.max(0, i - 30), i + 40))}\n` +
      `    rebuilt : ${JSON.stringify(b.slice(Math.max(0, i - 30), i + 40))}`,
  );
}

console.log(`compared ${ours.length} rebuilt page(s): ${ok} exact, ${failures.length} different`);
for (const f of failures) console.log(`  MISMATCH ${f}`);
process.exit(failures.length ? 1 : 0);
