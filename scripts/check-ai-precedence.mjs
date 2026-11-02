/**
 * Static source guard: fails if any component renders AI-generated text
 * in preference to official legislative text.
 *
 * This is the pattern that caused a real fidelity bug in BillCard.tsx:
 *   {bill.aiSummary?.summary || bill.summary}   <- AI stood in for official
 *
 * See docs/content-fidelity-policy.md §2.3.
 *
 * Run: cmd /c "node scripts/check-ai-precedence.mjs"
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = join(root, "src");

/** AI field appearing before an official field inside one expression. */
const VIOLATIONS = [
  { re: /aiSummary\?\.(summary|title)\s*\|\|\s*bill\.(summary|full_summary|full_title|title)/g,
    why: "AI summary/title is checked before the official one" },
  { re: /aiSummary\?\.(summaryBullets)\s*\|\|\s*bill\.(summary_bullets)/g,
    why: "AI bullets are checked before the official ones" },
];

/** Known-safe: the fenced "Not official text" block in BillDetail.tsx. */
function isFenced(text, index) {
  // Walk back to the nearest preceding AI-labelling marker.
  const window = text.slice(Math.max(0, index - 4000), index);
  const lastLabel = window.lastIndexOf("Not official text");
  const lastSectionClose = window.lastIndexOf("</section>");
  const lastOpenSection = window.lastIndexOf("<section");
  if (lastLabel === -1) return false;
  // Label must be inside the section that is still open at `index`.
  return lastLabel > lastOpenSection && lastLabel > lastSectionClose;
}

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(name) && !/\.test\./.test(name)) out.push(p);
  }
  return out;
}

const files = walk(srcDir);
const hits = [];

for (const file of files) {
  const text = readFileSync(file, "utf8");
  for (const { re, why } of VIOLATIONS) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(text)) !== null) {
      if (isFenced(text, m.index)) {
        console.log(`  skip (fenced as non-official) ${relative(root, file)}: ${why}`);
        continue;
      }
      const line = text.slice(0, m.index).split("\n").length;
      hits.push({ file: relative(root, file), line, why, snippet: m[0] });
    }
  }
}

console.log(`\nScanned ${files.length} source files for AI-over-official precedence.`);
if (hits.length === 0) {
  console.log("PASS: no AI-generated text takes precedence over official text.");
  process.exit(0);
}

console.log(`FAIL: ${hits.length} violation(s):`);
for (const h of hits) {
  console.log(`  ${h.file}:${h.line}  ${h.why}`);
  console.log(`    ${h.snippet}`);
}
process.exit(1);
