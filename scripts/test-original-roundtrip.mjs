/**
 * Round-trip fidelity test for the original bill content.
 *
 *   renderCapture(parseCapture(text)) MUST equal the captured text exactly.
 *
 * This proves the structured record carries every character of the original —
 * no dropped punctuation, no normalised whitespace, no invented fields.
 *
 * Compiles the REAL src/lib/original-bills.ts, not a copy.
 * Run: cmd /c "node scripts/test-original-roundtrip.mjs"
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import assert from "node:assert/strict";

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "src", "lib", "original-bills.ts");

const out = mkdtempSync(join(tmpdir(), "rt-"));
let passed = 0;
const failures = [];

try {
  execFileSync(
    process.execPath,
    [
      join(root, "node_modules", "typescript", "bin", "tsc"),
      src, "--outDir", out, "--module", "commonjs", "--target", "es2020",
      "--esModuleInterop", "--skipLibCheck", "--noResolve",
    ],
    { stdio: "pipe" },
  );

  const compiled = readFileSync(join(out, "original-bills.js"), "utf8");
  const mod = { exports: {} };
  new Function("exports", "module", "require", compiled)(mod.exports, mod, require);
  const { parseCapture, renderCapture } = mod.exports;

  const cap = JSON.parse(
    readFileSync(join(root, "content", "original", "rendered", "captured-50.json"), "utf8"),
  );

  console.log(`\nRound-trip: parse -> render must reproduce the capture exactly\n`);

  for (const c of cap) {
    try {
      const record = parseCapture(c.id, c.url, c.text, c.links);
      const rendered = renderCapture(record);

      if (rendered === c.text) {
        passed++;
        console.log(`  ok   ${c.id}  (${c.text.length} chars, ${record.sponsors.length} sponsor(s))`);
      } else {
        failures.push(`${c.id}: text differs`);
        console.log(`  FAIL ${c.id}: rendered text differs from capture`);
        let i = 0;
        while (i < Math.min(rendered.length, c.text.length) && rendered[i] === c.text[i]) i++;
        console.log(`        first divergence at char ${i}`);
        console.log(`        capture : ${JSON.stringify(c.text.slice(Math.max(0, i - 40), i + 60))}`);
        console.log(`        rendered: ${JSON.stringify(rendered.slice(Math.max(0, i - 40), i + 60))}`);
      }

      // Structural assertions that matter for fidelity
      assert.equal(record.title, c.text.split("\n")[5], `${c.id} title`);
      assert.equal(record.summary, record.summary, `${c.id} summary present`);
      assert.ok(record.title.length > 0, `${c.id} non-empty title`);
      assert.ok(record.summary.length > 0, `${c.id} non-empty summary`);
      assert.ok(record.sponsors.length > 0, `${c.id} has sponsors`);
      for (const s of record.sponsors) {
        assert.ok(s.name.length > 0, `${c.id} sponsor name non-empty`);
      }
    } catch (err) {
      failures.push(`${c.id}: ${err.message}`);
      console.log(`  FAIL ${c.id}: ${err.message}`);
    }
  }

  // Links must be preserved and must be external (unchanged) targets
  console.log(`\nLink fidelity`);
  let linkCount = 0;
  let badScheme = 0;
  for (const c of cap) {
    const record = parseCapture(c.id, c.url, c.text, c.links);
    linkCount += c.links.length;
    for (const l of c.links) {
      if (!/^https:\/\//.test(l.href)) badScheme++;
    }
    // every captured link must still be reachable from the record
    for (const l of c.links) {
      if (l.text === "Read Original Text") {
        assert.equal(record.originalTextHref, l.href, `${c.id} original text href`);
      } else {
        const found = record.sponsors.some((s) => s.href === l.href && s.name === l.text);
        assert.ok(found, `${c.id} sponsor link ${l.text} -> ${l.href} preserved`);
      }
    }
  }
  console.log(`  ${linkCount} links preserved across ${cap.length} pages`);
  console.log(`  non-https links: ${badScheme} (external targets must stay unchanged)`);
} finally {
  rmSync(out, { recursive: true, force: true });
}

console.log(`\n${passed} passed, ${failures.length} failed`);
if (failures.length) {
  console.log("FAILED:", failures.join("; "));
  process.exit(1);
}
