/**
 * Content-fidelity tests for src/lib/legislation.ts
 *
 * Asserts that official legislative text always takes precedence over
 * AI-generated text, per docs/content-fidelity-policy.md §2.3.
 *
 * Compiles the REAL source (not a copy) with tsc, then runs assertions in node.
 * Run: cmd /c "node scripts/test-content-fidelity.mjs"
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "src", "lib", "legislation.ts");

let passed = 0;
let failed = 0;
const failures = [];

function check(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ok   ${name}`);
  } catch (err) {
    failed++;
    failures.push(name);
    console.log(`  FAIL ${name}`);
    console.log(`       ${err.message}`);
  }
}

// --- compile the real source to CJS so node can import it ---
const out = mkdtempSync(join(tmpdir(), "fidelity-"));
try {
  execFileSync(
    process.execPath,
    [
      join(root, "node_modules", "typescript", "bin", "tsc"),
      src,
      "--outDir", out,
      "--module", "commonjs",
      "--target", "es2020",
      "--esModuleInterop",
      "--skipLibCheck",
      "--noResolve",
    ],
    { stdio: "pipe" },
  );

  const compiled = readFileSync(join(out, "legislation.js"), "utf8");
  const mod = { exports: {} };
  new Function("exports", "module", "require", compiled)(mod.exports, mod, require);
  const L = mod.exports;

  // --- fixtures ---
  const OFFICIAL_TITLE = "Military Domestic Violence Survivors Support Act";
  const OFFICIAL_SUMMARY =
    "Referred to the House Committee on Armed Services.";
  const OFFICIAL_BULLETS = [
    "Extends Special Victims’ Counsel services to domestic violence victims in the military.",
    "Amends title 10 provisions, expanding who can receive domestic violence support.",
  ];
  const AI_TITLE = "A friendly AI-written title for this bill";
  const AI_SUMMARY = "AI paraphrase of what this bill does.";
  const AI_BULLETS = ["AI bullet one", "AI bullet two"];

  const base = {
    bill_number: "HB10870",
    title: OFFICIAL_TITLE,
    full_title: OFFICIAL_TITLE,
    summary: OFFICIAL_SUMMARY,
    summary_bullets: OFFICIAL_BULLETS,
    aiSummary: { title: AI_TITLE, summary: AI_SUMMARY, summaryBullets: AI_BULLETS },
    source: "legiscan",
    level: "Federal",
  };

  console.log("\ncontent fidelity — official text precedence");

  check("billTitle prefers official title over AI title", () => {
    assert.equal(L.billTitle(base), OFFICIAL_TITLE);
  });

  check("billTitle never returns the AI title when official exists", () => {
    assert.notEqual(L.billTitle(base), AI_TITLE);
  });

  check("billTitle falls back to plain title when full_title absent", () => {
    const b = { ...base, full_title: undefined };
    assert.equal(L.billTitle(b), OFFICIAL_TITLE);
  });

  check("billTitle uses AI title only when NO official title exists", () => {
    const b = { ...base, full_title: undefined, title: undefined };
    assert.equal(L.billTitle(b), AI_TITLE);
  });

  check("billTitle returns empty string when nothing exists (no invented text)", () => {
    const b = { ...base, full_title: undefined, title: undefined, aiSummary: undefined };
    assert.equal(L.billTitle(b), "");
  });

  check("billBullets prefers official bullets over AI bullets", () => {
    assert.deepEqual(L.billBullets(base), OFFICIAL_BULLETS);
  });

  check("billBullets never returns AI bullets when official exist", () => {
    assert.notDeepEqual(L.billBullets(base), AI_BULLETS);
  });

  check("billBullets falls back to AI bullets only when no official ones", () => {
    const b = { ...base, summary_bullets: undefined };
    assert.deepEqual(L.billBullets(b), AI_BULLETS);
  });

  check("billBullets returns [] when nothing exists (no invented bullets)", () => {
    const b = { ...base, summary_bullets: undefined, aiSummary: undefined };
    assert.deepEqual(L.billBullets(b), []);
  });

  // --- text must survive normalisation unaltered ---
  console.log("\ncontent fidelity — text passes through unmodified");

  check("normaliseBills does not alter title text", () => {
    const [r] = L.normaliseBills([base]);
    assert.equal(r.full_title, OFFICIAL_TITLE);
    assert.equal(r.title, OFFICIAL_TITLE);
  });

  check("normaliseBills does not alter summary text", () => {
    const [r] = L.normaliseBills([base]);
    assert.equal(r.summary, OFFICIAL_SUMMARY);
    assert.deepEqual(r.summary_bullets, OFFICIAL_BULLETS);
  });

  check("normaliseBills preserves punctuation/case/typography exactly", () => {
    const tricky = {
      ...base,
      title: "Don’t “fix” this — it's the ORIGINAL, e.g. verbatim…",
      summary: "  leading and trailing spaces are content too  ",
    };
    const [r] = L.normaliseBills([tricky]);
    assert.equal(r.title, "Don’t “fix” this — it's the ORIGINAL, e.g. verbatim…");
    assert.equal(r.summary, "  leading and trailing spaces are content too  ");
  });

  check("normaliseBills preserves non-ASCII (curly quotes, dashes, accents)", () => {
    const uni = { ...base, title: "Café — naïve “quoted” ‘single’ ✓" };
    const [r] = L.normaliseBills([uni]);
    assert.equal(r.title, "Café — naïve “quoted” ‘single’ ✓");
  });

  check("billDisplayNumber preserves official formatting", () => {
    assert.equal(L.billDisplayNumber(base), "H.R. 10870");
  });
} finally {
  rmSync(out, { recursive: true, force: true });
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.log("FAILED:", failures.join(", "));
  process.exit(1);
}
