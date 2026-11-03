/**
 * original-bills-store.ts — server-only loader for the protected original
 * content store (content/original/).
 *
 * Reads the machine-captured pages and parses them into structured records via
 * the lossless round-trip parser. Never writes, never fetches, never invents.
 *
 * If a page is missing from the store, it is reported as missing — no fallback
 * content is generated (docs/content-fidelity-policy.md §2.4).
 */

import "server-only";

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { parseCapture, type OriginalBill, type OriginalLink } from "./original-bills";

interface CapturedPage {
  id: string;
  url: string;
  text: string;
  links: OriginalLink[];
}

let cache: Map<string, OriginalBill> | null = null;

function load(): Map<string, OriginalBill> {
  if (cache) return cache;

  const dir = join(process.cwd(), "content", "original");
  const raw = readFileSync(join(dir, "rendered", "captured-50.json"), "utf8");
  const pages = JSON.parse(raw) as CapturedPage[];

  const map = new Map<string, OriginalBill>();
  for (const p of pages) {
    map.set(p.id, parseCapture(p.id, p.url, p.text, p.links));
  }
  cache = map;
  return map;
}

/** Returns the original bill, or null when it is not in the store. */
export function getOriginalBill(id: string): OriginalBill | null {
  return load().get(id) ?? null;
}

/** All original bills, sorted by id. */
export function listOriginalBills(): OriginalBill[] {
  return [...load().values()].sort((a, b) => a.id.localeCompare(b.id));
}

/** Ids present in the store — used to report missing content honestly. */
export function originalBillIds(): string[] {
  return [...load().keys()].sort();
}
