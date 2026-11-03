/**
 * Reverse-derives how the original site computes the display fields that are
 * NOT present in the raw API payload (policy area, emoji, level, jurisdiction,
 * status label, dates, progress labels, sponsor roles).
 *
 * Only reports what the stored original data actually contains — no guessing.
 *
 * Run: cmd /c "node scripts/derive-original-display.mjs"
 */
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = join(root, "content", "original", "bills");

const files = readdirSync(dir).filter((f) => f.endsWith(".json")).sort();

/** Rendered captures we have (batch-01) — the ground truth to match. */
const rendered = JSON.parse(
  readFileSync(join(root, "content", "original", "rendered", "batch-01.json"), "utf8"),
);
const renderedById = Object.fromEntries(rendered.map((r) => [r.id, r]));

console.log("=== SAMPLE: shape-B record full field dump (2161201) ===");
const b = JSON.parse(readFileSync(join(dir, "2161201.json"), "utf8")).data.bill;
for (const [k, v] of Object.entries(b)) {
  const s = JSON.stringify(v);
  console.log(`  ${k}: ${s.length > 300 ? s.slice(0, 300) + "..." : s}`);
}

console.log("\n=== Does 'subjects' explain the displayed policy area? ===");
for (const id of ["2161200", "2161201", "2161202", "2161524", "2161525", "2161532", "2161533"]) {
  const bill = JSON.parse(readFileSync(join(dir, `${id}.json`), "utf8")).data.bill;
  const cap = renderedById[id];
  const capLines = cap ? cap.text.split("\n") : [];
  // displayed line 3 (after "Back to Feed","Federal",emoji) is the policy area
  const displayedPolicy = capLines[3];
  console.log(`  ${id}`);
  console.log(`     displayed policy area : ${displayedPolicy}`);
  console.log(`     api policy_area       : ${bill.policy_area ?? "(absent)"}`);
  console.log(`     api subjects          : ${JSON.stringify(bill.subjects)}`);
  console.log(`     api state             : ${bill.state}  state_id: ${bill.state_id}`);
}

console.log("\n=== status mapping (shape-B status is numeric) ===");
const statusSeen = {};
for (const f of files) {
  const bill = JSON.parse(readFileSync(join(dir, f), "utf8")).data.bill;
  const cap = renderedById[bill.bill_id];
  const label = cap ? cap.text.split("\n")[4] : "(no capture)";
  const key = `${typeof bill.status}:${bill.status}`;
  statusSeen[key] ??= new Set();
  statusSeen[key].add(label);
}
for (const [k, v] of Object.entries(statusSeen)) {
  console.log(`  status=${k} -> displayed labels: ${[...v].join(" | ")}`);
}

console.log("\n=== progress structure ===");
for (const id of ["2161200", "2161201"]) {
  const bill = JSON.parse(readFileSync(join(dir, `${id}.json`), "utf8")).data.bill;
  console.log(`  ${id} progress: ${JSON.stringify(bill.progress)}`);
  console.log(`  ${id} history : ${JSON.stringify(bill.history)?.slice(0, 400)}`);
}

console.log("\n=== sponsor record shape ===");
const s0 = JSON.parse(readFileSync(join(dir, "2161200.json"), "utf8")).data.bill.sponsors;
console.log(`  ${JSON.stringify(s0, null, 2)}`);
