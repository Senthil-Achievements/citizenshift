/**
 * For each rendered capture, locate WHERE the displayed policy area lives in
 * the raw API payload. If it exists nowhere, the original site derives it and
 * we must capture the displayed value rather than invent a mapping.
 *
 * Run: cmd /c "node scripts/locate-policy-area.mjs"
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const billDir = join(root, "content", "original", "bills");
const rendered = JSON.parse(
  readFileSync(join(root, "content", "original", "rendered", "batch-01.json"), "utf8"),
);

/** Walk the whole payload, returning JSON paths whose string value equals needle. */
function findPaths(obj, needle, path = "$", out = []) {
  if (out.length > 5) return out;
  if (typeof obj === "string") {
    if (obj === needle) out.push(path);
    return out;
  }
  if (Array.isArray(obj)) {
    obj.forEach((v, i) => findPaths(v, needle, `${path}[${i}]`, out));
    return out;
  }
  if (obj && typeof obj === "object") {
    for (const [k, v] of Object.entries(obj)) findPaths(v, needle, `${path}.${k}`, out);
  }
  return out;
}

for (const cap of rendered) {
  const lines = cap.text.split("\n");
  const emojiLine = lines[2];
  const displayedPolicy = lines[3];
  const payload = JSON.parse(readFileSync(join(billDir, `${cap.id}.json`), "utf8"));
  const shape = payload.data.bill.level !== undefined ? "A" : "B";

  const exact = findPaths(payload, displayedPolicy);
  const partial = [];
  if (exact.length === 0) {
    // any string containing it (or vice versa)?
    const flat = JSON.stringify(payload);
    if (flat.includes(displayedPolicy)) partial.push("(substring somewhere)");
  }

  console.log(`${cap.id}  shape=${shape}`);
  console.log(`   displayed: "${displayedPolicy}"  emoji: ${emojiLine}`);
  console.log(`   exact match at: ${exact.length ? exact.join(", ") : "NOT FOUND"}`);
  if (partial.length) console.log(`   partial: ${partial.join(", ")}`);
}

console.log("\n=== emoji -> policy area pairs observed ===");
const pairs = rendered.map((c) => {
  const l = c.text.split("\n");
  return `${l[2]}  ${l[3]}`;
});
console.log([...new Set(pairs)].sort().join("\n"));
