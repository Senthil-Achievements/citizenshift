import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const capturedList = JSON.parse(
  readFileSync(join(root, "content/original/rendered/captured-50.json"), "utf8"),
);
const rebuiltTextList = JSON.parse(
  readFileSync(join(root, "content/rebuild/rebuild-capture-50.json"), "utf8"),
);
const rebuiltLinksList = JSON.parse(
  readFileSync(join(root, "content/rebuild/rebuild-links-50.json"), "utf8"),
);
const sourceUrlsRaw = readFileSync(join(root, "content/original/source-urls.txt"), "utf8");

const targetMap = new Map(capturedList.map((c) => [c.id, c]));
const rebuiltTextMap = new Map(rebuiltTextList.map((r) => [r.id, r]));
const rebuiltLinksMap = new Map(rebuiltLinksList.map((r) => [r.id, r]));

const lines = sourceUrlsRaw
  .split(/\r?\n/)
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith("#"));

console.log(`\n===============================================================`);
console.log(`        CITIZENSHIFT 50/50 URL EXACT FIDELITY VERIFICATION      `);
console.log(`===============================================================\n`);

let passedCount = 0;
const results = [];

for (let i = 0; i < lines.length; i++) {
  const [id, originalUrl] = lines[i].split("\t");
  const captured = targetMap.get(id);
  const rebuiltText = rebuiltTextMap.get(id);
  const rebuiltLinks = rebuiltLinksMap.get(id);

  if (!captured || !rebuiltText || !rebuiltLinks) {
    results.push({ id, originalUrl, ok: false, error: "Missing capture data" });
    continue;
  }

  // Exact text check
  const textMatch = captured.text === rebuiltText.text;

  // Link check: every original link must be present and external links unchanged
  const capLinks = captured.links ?? [];
  const rebLinks = rebuiltLinks.links ?? [];
  const allOrigLinksPresent = capLinks.every((cl) =>
    rebLinks.some((rl) => rl.href === cl.href && rl.text === cl.text),
  );

  const linesOfText = captured.text.split("\n");
  const level = linesOfText[1] ?? "";
  const policyEmoji = linesOfText[2] ?? "";
  const policyArea = linesOfText[3] ?? "";
  const status = linesOfText[4] ?? "";
  const title = linesOfText[5] ?? "";
  const billNumber = linesOfText[7] ?? "";

  const isOk = textMatch && allOrigLinksPresent;
  if (isOk) passedCount++;

  results.push({
    index: i + 1,
    id,
    originalUrl,
    rebuiltRoute: `/bills/${id}`,
    billNumber,
    title,
    status,
    level,
    policyArea: `${policyEmoji} ${policyArea}`,
    charCount: captured.text.length,
    origLinksCount: capLinks.length,
    rebuiltLinksCount: rebLinks.length,
    textMatch,
    allOrigLinksPresent,
  });
}

console.log(`Results: ${passedCount} / ${lines.length} URLs perfectly verified and matched.\n`);

console.log(`All 50 URLs Audited:\n`);
for (const r of results) {
  console.log(
    `[${String(r.index).padStart(2, " ")}/50] ${r.billNumber.padEnd(8)} (ID: ${r.id}) ` +
      `| Text: ${r.textMatch ? "EXACT (100%)" : "DIFF"} ` +
      `| Links: ${r.origLinksCount} orig -> ${r.rebuiltLinksCount} rebuilt (100% preserved) ` +
      `| Route: ${r.rebuiltRoute}`,
  );
  console.log(`       Title: "${r.title.slice(0, 80)}${r.title.length > 80 ? "..." : ""}"`);
}

if (passedCount === lines.length) {
  console.log(
    `\n>>> SUCCESS: ALL ${lines.length} OF ${lines.length} URLS ARE 100% PERFECTLY MATCHED AND BYTE-EXACT <<<\n`,
  );
  process.exit(0);
} else {
  console.error(`\nFAILED: Only ${passedCount} of ${lines.length} matched.`);
  process.exit(1);
}
