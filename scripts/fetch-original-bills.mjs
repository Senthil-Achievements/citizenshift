/**
 * Fetches original CitizenShift bill content verbatim from the source site.
 *
 * The public /bills/<id> pages are client-rendered shells; the displayed
 * content comes from /api/bills/<id>. We store the RAW response bytes with
 * no reformatting, so the stored file is byte-identical to what the source
 * served. Nothing is paraphrased, reordered or "cleaned up".
 *
 * Run: cmd /c "node scripts/fetch-original-bills.mjs"
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const listFile = join(root, "content", "original", "source-urls.txt");
const outDir = join(root, "content", "original", "bills");
const logFile = join(root, "content", "original", "fetch-log.jsonl");

const TIMEOUT_MS = 30_000;
const BASE = "https://citizenshift.vercel.app";

mkdirSync(outDir, { recursive: true });

const lines = readFileSync(listFile, "utf8")
  .split(/\r?\n/)
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith("#"));

const targets = lines.map((l) => {
  const [id, url] = l.split("\t");
  return { id: id.trim(), url: url.trim() };
});

const log = [];

async function fetchOne({ id, url }) {
  const apiUrl = `${BASE}/api/bills/${id}`;
  const started = Date.now();
  try {
    const res = await fetch(apiUrl, {
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { accept: "application/json", "user-agent": "CitizenShift-rebuild/1.0" },
    });
    const buf = Buffer.from(await res.arrayBuffer());
    if (!res.ok) {
      return { id, url, apiUrl, ok: false, status: res.status, bytes: 0, ms: Date.now() - started };
    }
    const file = join(outDir, `${id}.json`);
    writeFileSync(file, buf); // raw bytes, untouched
    // Validate it is parseable JSON so we know content actually arrived.
    let parsed = null;
    let billKeys = 0;
    try {
      parsed = JSON.parse(buf.toString("utf8"));
      billKeys = Object.keys(parsed?.data?.bill ?? {}).length;
    } catch {
      return { id, url, apiUrl, ok: false, status: res.status, bytes: buf.length, error: "invalid JSON", ms: Date.now() - started };
    }
    if (billKeys === 0) {
      return { id, url, apiUrl, ok: false, status: res.status, bytes: buf.length, error: "no bill object", ms: Date.now() - started };
    }
    return { id, url, apiUrl, ok: true, status: res.status, bytes: buf.length, billKeys, ms: Date.now() - started };
  } catch (err) {
    return { id, url, apiUrl, ok: false, status: 0, bytes: 0, error: String(err?.message ?? err), ms: Date.now() - started };
  }
}

// Modest concurrency: 6 at a time.
const results = [];
let cursor = 0;
const WORKERS = 6;

async function worker() {
  while (cursor < targets.length) {
    const t = targets[cursor++];
    const r = await fetchOne(t);
    results.push(r);
    const mark = r.ok ? "OK  " : "FAIL";
    console.log(`${mark} ${r.id}  ${r.bytes}B  ${r.ms}ms${r.error ? `  ${r.error}` : ""}`);
  }
}

await Promise.all(Array.from({ length: WORKERS }, worker));

results.sort((a, b) => a.id.localeCompare(b.id));

// Persist an honest, per-URL log — failures are recorded, never guessed at.
writeFileSync(logFile, results.map((r) => JSON.stringify(r)).join("\n") + "\n", "utf8");

const ok = results.filter((r) => r.ok);
const bad = results.filter((r) => !r.ok);

console.log(`\nFetched ${ok.length}/${results.length} bills.`);
console.log(`Stored raw JSON in content/original/bills/`);
console.log(`Log: content/original/fetch-log.jsonl`);

if (bad.length) {
  console.log(`\nNOT RETRIEVED (${bad.length}) — reported, not guessed:`);
  for (const b of bad) console.log(`  ${b.id}  ${b.url}  -> ${b.error ?? b.status}`);
}

process.exit(bad.length ? 1 : 0);
