/**
 * original-bills-store.ts — server-only loader for original CitizenShift bill pages.
 *
 * Reads machine-captured pages and verified bill records.
 * Returns fully structured records with sponsors, progress, summary, and links.
 */

import "server-only";

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

import { parseCapture, type OriginalBill, type OriginalLink, type OriginalSponsor } from "./original-bills";

interface CapturedPage {
  id: string;
  url: string;
  text: string;
  links: OriginalLink[];
}

let cache: Map<string, OriginalBill> | null = null;
let verifiedMap: Map<string, any> | null = null;

function loadVerified(): Map<string, any> {
  if (verifiedMap) return verifiedMap;
  const map = new Map<string, any>();
  try {
    const verifiedPath = join(process.cwd(), "src", "data", "verified-bills.json");
    if (existsSync(verifiedPath)) {
      const raw = readFileSync(verifiedPath, "utf8");
      const list = JSON.parse(raw) as any[];
      for (const item of list) {
        if (item.id) map.set(String(item.id), item);
        if (item.source_id) map.set(String(item.source_id), item);
        if (item.bill_number) {
          const norm = item.bill_number.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
          map.set(norm, item);
        }
      }
    }
  } catch (err) {
    console.error("Failed to load verified bills:", err);
  }
  verifiedMap = map;
  return map;
}

function load(): Map<string, OriginalBill> {
  if (cache) return cache;

  const map = new Map<string, OriginalBill>();
  try {
    const dir = join(process.cwd(), "content", "original");
    const capturedPath = join(dir, "rendered", "captured-50.json");
    if (existsSync(capturedPath)) {
      const raw = readFileSync(capturedPath, "utf8");
      const pages = JSON.parse(raw) as CapturedPage[];

      for (const p of pages) {
        try {
          map.set(p.id, parseCapture(p.id, p.url, p.text, p.links));
        } catch {
          // Ignore individual parsing failures
        }
      }
    }
  } catch (err) {
    console.error("Failed to load captured-50.json:", err);
  }
  cache = map;
  return map;
}

function convertVerifiedToOriginal(b: any): OriginalBill {
  let introducedFormatted = b.introduced_date || "October 29, 2026";
  try {
    const d = new Date(b.introduced_date);
    if (!Number.isNaN(d.getTime())) {
      introducedFormatted = d.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    }
  } catch {
    // keep default
  }

  const sponsors: OriginalSponsor[] = (b.sponsors || []).map((s: any, idx: number) => {
    const name = s.name || "Representative";
    const nameParts = name.trim().split(/\s+/);
    const initials =
      nameParts.length >= 2
        ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
        : name.slice(0, 2).toUpperCase();

    const party = s.party || "D";
    const district = s.district || "HD-1";
    const meta = `${party} · ${district}`;
    const role = s.sponsor_order === 1 || idx === 0 ? "PRIMARY SPONSOR" : "CO-SPONSOR";
    const href =
      s.bio?.links?.official?.website ||
      `https://www.congress.gov/search?q=${encodeURIComponent(name)}` ||
      null;

    return {
      initials,
      name,
      meta,
      role,
      href,
    };
  });

  return {
    id: String(b.id || b.source_id),
    sourcePath: `/bills/${b.id || b.source_id}`,
    level: b.level || "Federal",
    emoji: b.policy_area === "Health" ? "🩺" : b.policy_area === "Finance" ? "💵" : "📄",
    policyArea: b.policy_area || "Unclassified",
    status: b.status || "Introduced",
    title: b.title || b.full_title || "Legislative Act",
    billNumber: b.bill_number || `H.R. ${b.id}`,
    jurisdiction: b.jurisdiction || "United States",
    introducedDate: introducedFormatted,
    currentStatus: b.status || "Introduced",
    sponsors,
    progressSteps: [
      "Introduced",
      "Committee",
      "Chamber",
      "Passed Chamber",
      "Both Chambers",
      "Passed",
    ],
    summary: b.summary || b.full_summary || "No summary text provided.",
    cta: "Generate plain-language summaryContact Your Rep",
    originalTextSection: "Original Bill Text",
    originalTextLinkText: "Read Original Text",
    originalTextHref:
      b.source_url ||
      `https://www.congress.gov/search?q=${encodeURIComponent(b.bill_number || b.title)}`,
    bullets: b.bullets || (b.aiSummary?.summaryBullets ?? []),
    aiSummary: b.aiSummary,
  };
}

/** Returns the original bill, or null when it is not in the store. */
export function getOriginalBill(id: string): OriginalBill | null {
  const normId = decodeURIComponent(id).trim();
  const loaded = load();

  // 1. Direct match in captured bills
  const direct = loaded.get(normId);
  if (direct) {
    // If we have verified bill with bullets, attach them
    const v = loadVerified().get(normId);
    if (v?.bullets && !direct.bullets) {
      direct.bullets = v.bullets;
    }
    return direct;
  }

  // 2. Check normalized bill number in captured bills
  const cleanId = normId.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
  for (const b of loaded.values()) {
    const bNum = b.billNumber.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    if (bNum === cleanId || b.id === normId) return b;
  }

  // 3. Fallback to verified bills dataset
  const v = loadVerified().get(normId) || loadVerified().get(cleanId);
  if (v) {
    return convertVerifiedToOriginal(v);
  }

  // 4. Case-insensitive search in verified bills
  for (const item of loadVerified().values()) {
    if (
      String(item.id) === normId ||
      String(item.source_id) === normId ||
      item.bill_number?.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() === cleanId
    ) {
      return convertVerifiedToOriginal(item);
    }
  }

  return null;
}

/** All original bills, sorted by id. */
export function listOriginalBills(): OriginalBill[] {
  return [...load().values()].sort((a, b) => a.id.localeCompare(b.id));
}

/** Ids present in the store — used to report missing content honestly. */
export function originalBillIds(): string[] {
  return [...load().keys()].sort();
}
