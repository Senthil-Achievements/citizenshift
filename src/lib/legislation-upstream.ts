/**
 * legislation-upstream.ts — server-only access to the CitizenShift live bill
 * service (LegiScan + AI summaries). Shared by /api/legislation and the
 * bill-detail routes so every surface reads the same live record.
 */

import { normaliseBills, type Bill, type LegislationLevel } from "@/lib/legislation";

export const UPSTREAM = process.env.LEGISLATION_UPSTREAM_URL ?? "https://citizenshift.vercel.app";
const TIMEOUT_MS = 30_000;

export interface UpstreamResult {
  bills: Bill[];
  availableLevels: LegislationLevel[];
  error?: string;
  /** When the record was retrieved live; absent when served from the last-verified cache. */
  retrievedAt?: string;
}

/** Last-verified fallback so a source outage never leaves visitors without a record. */
const cache = new Map<string, { at: string; result: UpstreamResult }>();

export async function fetchUpstreamBills(state = "FL", q = ""): Promise<UpstreamResult> {
  const key = `${state}|${q}`;
  const upstream = q
    ? `${UPSTREAM}/api/bills/search?state=${encodeURIComponent(state)}&q=${encodeURIComponent(q)}`
    : `${UPSTREAM}/api/recommendations?state=${encodeURIComponent(state)}`;

  try {
    const res = await fetch(upstream, {
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { accept: "application/json" },
    });
    if (!res.ok) throw new Error(`upstream ${res.status}`);
    const payload = (await res.json()) as {
      data?: { bills?: unknown; availableLevels?: string[] };
      bills?: unknown;
      availableLevels?: string[];
    };
    const inner = payload?.data ?? payload;
    const result: UpstreamResult = {
      bills: normaliseBills(inner?.bills as never),
      availableLevels: inner?.availableLevels?.length
        ? (inner.availableLevels as LegislationLevel[])
        : ["Federal"],
      retrievedAt: new Date().toISOString(),
    };
    cache.set(key, { at: new Date().toISOString(), result });
    return result;
  } catch (err) {
    const hit = cache.get(key);
    const result = hit?.result ?? { bills: [], availableLevels: ["Federal" as const] };
    return { ...result, error: `upstream-unavailable${err instanceof Error ? `: ${err.message}` : ""}` };
  }
}

/** Find one bill by its parsed federal identifier (congress/type/number). */
export function findByIdentifier(
  bills: Bill[],
  congress: number,
  type: string,
  number: string,
): Bill | undefined {
  return bills.find((b) => {
    const parsed = parseBillNumberTypeSafe(billNumberString(b));
    return (
      (b.bill_number ?? "").toLowerCase().replace(/[.\s]/g, "").endsWith(`${type}${number}`) &&
      parsed.congress === congress
    );
  });
}

/** Normalise whatever the upstream writes into "H.R. 10905" style. */
export function billNumberString(b: Bill): string {
  return String(b.bill_number ?? "").trim();
}

export interface ParsedBillNumber {
  type: string; // hr | s | hres | sres | hjres | sjres | hconres | sconres
  label: string; // H.R. / S. / H.Res. …
  number: string;
  congress: number | null;
  chamber: "House" | "Senate" | null;
  isResolution: boolean;
}

const TYPE_MAP: { pattern: RegExp; type: string; label: string; chamber: "House" | "Senate" | "Joint"; isResolution: boolean }[] = [
  { pattern: /^h\.?\s?con\.?\s?res/i, type: "hconres", label: "H.Con.Res.", chamber: "House", isResolution: true },
  { pattern: /^s\.?\s?con\.?\s?res/i, type: "sconres", label: "S.Con.Res.", chamber: "Senate", isResolution: true },
  { pattern: /^h\.?\s?j\.?\s?res/i, type: "hjres", label: "H.J.Res.", chamber: "House", isResolution: true },
  { pattern: /^s\.?\s?j\.?\s?res/i, type: "sjres", label: "S.J.Res.", chamber: "Senate", isResolution: true },
  { pattern: /^h\.?\s?res/i, type: "hres", label: "H.Res.", chamber: "House", isResolution: true },
  { pattern: /^s\.?\s?res/i, type: "sres", label: "S.Res.", chamber: "Senate", isResolution: true },
  { pattern: /^(h\.?r\.?|h\.?b\.?)\s/i, type: "hr", label: "H.R.", chamber: "House", isResolution: false },
  { pattern: /^(s\.?)\s/i, type: "s", label: "S.", chamber: "Senate", isResolution: false },
];

/** Parse "H.R. 10905" / "HB10905" / "S. 1234" into a stable identifier. */
export function parseBillNumberTypeSafe(raw: string): ParsedBillNumber {
  const cleaned = (raw || "").trim().replace(/\u00A0/g, " ");
  for (const { pattern, type, label, chamber, isResolution } of TYPE_MAP) {
    const m = cleaned.match(pattern);
    if (m) {
      const rest = cleaned.slice(m[0].length).trim();
      const number = (rest.match(/\d+/)?.[0]) ?? "";
      return {
        type,
        label,
        number,
        congress: congressFromYear(cleaned) ?? guessCurrentCongress(),
        chamber: chamber === "Joint" ? null : chamber,
        isResolution,
      };
    }
  }
  const number = cleaned.match(/\d+/)?.[0] ?? "";
  return { type: "unknown", label: cleaned.split(/\s\d/)[0] || cleaned, number, congress: guessCurrentCongress(), chamber: null, isResolution: false };
}

/** Federal congress cycles: 118th = 2023–24, 119th = 2025–26, 120th = 2027–28. */
export function congressFromYear(raw: string): number | null {
  const year = Number(raw.match(/20\d{2}/)?.[0]);
  if (!year || year < 2021 || year > 2030) return null;
  return year <= 2024 ? 118 : year <= 2026 ? 119 : year <= 2028 ? 120 : null;
}

export function guessCurrentCongress(now = new Date()): number {
  const y = now.getFullYear();
  return y <= 2024 ? 118 : y <= 2026 ? 119 : y <= 2028 ? 120 : 121;
}
