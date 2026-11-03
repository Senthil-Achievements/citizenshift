/**
 * Inventory of fetched original bill content: which fields exist across the
 * 50 stored records, and which required display fields are ABSENT.
 * Absences are reported, never filled in.
 *
 * Run: cmd /c "node scripts/inventory-original-bills.mjs"
 */
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = join(root, "content", "original", "bills");

const files = readdirSync(dir).filter((f) => f.endsWith(".json")).sort();

/** Fields the rebuilt BillDetail / BillCard actually render. */
const REQUIRED_FOR_DISPLAY = [
  "title", "number", "bill_number", "status", "status_date",
  "introduced_date", "policy_area", "jurisdiction", "level",
  "sponsors", "description", "source", "source_id", "bill_id",
];

/** Displayed by the site but not always present in the API. */
const DISPLAY_FIELDS = [
  "summary", "full_summary", "summary_bullets", "full_title",
  "texts", "committee", "change_hash",
];

const fieldCount = {};
const present = {};
const missingRequired = {};
const missingDisplay = {};

for (const f of files) {
  const raw = readFileSync(join(dir, f), "utf8");
  const j = JSON.parse(raw);
  const bill = j?.data?.bill ?? {};
  for (const k of Object.keys(bill)) fieldCount[k] = (fieldCount[k] ?? 0) + 1;

  for (const k of REQUIRED_FOR_DISPLAY) {
    const v = bill[k];
    const has = v !== undefined && v !== null && !(Array.isArray(v) && v.length === 0) && v !== "";
    if (has) present[k] = (present[k] ?? 0) + 1;
    else (missingRequired[k] ??= []).push(bill.bill_id ?? f);
  }
  for (const k of DISPLAY_FIELDS) {
    const v = bill[k];
    const has = v !== undefined && v !== null && !(Array.isArray(v) && v.length === 0) && v !== "";
    if (has) present[k] = (present[k] ?? 0) + 1;
    else (missingDisplay[k] ??= []).push(bill.bill_id ?? f);
  }
}

console.log(`Records: ${files.length}\n`);

console.log("=== ALL KEYS PRESENT (field: count/50) ===");
for (const [k, c] of Object.entries(fieldCount).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(c).padStart(3)}/50  ${k}`);
}

console.log("\n=== REQUIRED-FOR-DISPLAY FIELDS MISSING FROM SOME RECORDS ===");
const reqMissing = Object.entries(missingRequired);
if (reqMissing.length === 0) console.log("  none — all required fields present in all records");
for (const [k, ids] of reqMissing) {
  console.log(`  ${k}: missing in ${ids.length} -> ${ids.join(", ")}`);
}

console.log("\n=== DISPLAY-ONLY FIELDS (summary/bullets/etc.) ===");
for (const [k, ids] of Object.entries(missingDisplay)) {
  console.log(`  ${k}: present in ${50 - ids.length}/50, missing in ${ids.length}`);
  if (ids.length && ids.length <= 50) console.log(`      missing ids: ${ids.join(", ")}`);
}

// Sponsors sanity
let noSponsor = [];
let sponsorCount = 0;
for (const f of files) {
  const bill = JSON.parse(readFileSync(join(dir, f), "utf8"))?.data?.bill ?? {};
  if (!bill.sponsors?.length) noSponsor.push(bill.bill_id ?? f);
  else sponsorCount++;
}
console.log(`\n=== SPONSORS ===`);
console.log(`  with sponsor: ${sponsorCount}/50`);
if (noSponsor.length) console.log(`  without: ${noSponsor.join(", ")}`);

// Titles: compare against the client-supplied titles in source-urls.txt
console.log("\n=== TITLE vs CLIENT-SUPPLIED LIST ===");
const list = readFileSync(join(root, "content", "original", "source-urls.txt"), "utf8")
  .split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith("#"));

// The list lines are "id\turl" — client titles were in the message, not the file.
// Report the stored official titles so they can be diffed by hand.
console.log("  stored official titles (first 5):");
files.slice(0, 5).forEach((f) => {
  const b = JSON.parse(readFileSync(join(dir, f), "utf8"))?.data?.bill ?? {};
  console.log(`    ${b.bill_id}: ${b.title}`);
});
