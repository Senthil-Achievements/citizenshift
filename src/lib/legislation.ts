/**
 * legislation.ts — shared types + helpers for the legislation experience.
 * Data source: CitizenShift's live bill service (LegiScan + AI summaries),
 * proxied server-side through /api/legislation. Never fabricate bill data.
 */

export type LegislationLevel = "Federal" | "State" | "Municipal";

export interface BillSummary {
  title: string;
  summary: string;
  summaryBullets: string[];
}

export interface Bill {
  id: string | number;
  bill_number: string;
  title: string;
  summary: string;
  full_title?: string;
  full_summary?: string;
  level: LegislationLevel;
  jurisdiction: string;
  status: string;
  policy_area: string;
  introduced_date: string;
  source: string;
  source_id?: string;
  /** The record's own document URL as provided by the upstream source. */
  source_url?: string;
  aiSummary?: BillSummary & { cached?: boolean };
  recommendationScore?: number;
  recommendationReasons?: string[];
  /** initial legislative summary, sometimes bulleted */
  summary_bullets?: string[];
  sponsors?: any[];
  bullets?: string[];
}

export interface LegislationResponse {
  bills: Bill[];
  availableLevels?: LegislationLevel[];
  interests?: string;
}

/** Statuses present in the live feed. */
export const STATUS_ORDER = [
  "Introduced",
  "Engrossed",
  "Enrolled",
  "Passed",
  "Vetoed",
  "Failed",
] as const;

/** A bill counts as "New" for 45 days after its introduction date. */
export const NEW_WINDOW_DAYS = 45;

export function isNew(bill: Bill, now = new Date()): boolean {
  const t = new Date(bill.introduced_date).getTime();
  if (Number.isNaN(t)) return false;
  return (now.getTime() - t) / 86_400_000 <= NEW_WINDOW_DAYS;
}

/** Passed covers both chamber-passed and enrolled/enacted stages. */
export function isPassed(bill: Bill): boolean {
  return /^(passed|enrolled|enacted|presented|signed)/i.test(bill.status);
}

export function matchesTopic(bill: Bill, topic: string): boolean {
  if (!topic || topic === "All") return true;
  const haystack = [bill.policy_area, bill.full_title ?? bill.title, bill.summary]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(topic.toLowerCase()) || bill.policy_area === topic;
}

/**
 * Official title first — never let AI-generated text stand in for it.
 * See docs/content-fidelity-policy.md §2.3.
 */
export function billTitle(bill: Bill): string {
  return bill.full_title || bill.title || bill.aiSummary?.title || "";
}

/**
 * Official summary bullets first; AI bullets only when no official ones exist.
 * See docs/content-fidelity-policy.md §2.3.
 */
export function billBullets(bill: Bill): string[] {
  if (bill.summary_bullets && bill.summary_bullets.length > 1) return bill.summary_bullets;
  if (bill.aiSummary?.summaryBullets?.length) return bill.aiSummary.summaryBullets;
  return [];
}

export function billDateLabel(bill: Bill): string {
  const d = new Date(bill.introduced_date);
  if (Number.isNaN(d.getTime())) return "";
  // UTC: upstream dates are midnight-UTC instants; a local offset could flip the calendar day.
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" });
}

/** Official display number, e.g. "H.R. 10905" from the compact "HB10905". */
export function billDisplayNumber(bill: Bill): string {
  const parsed = parseBillNumber(bill.bill_number);
  return parsed ? `${parsed.billTypeLabel} ${parsed.number}` : bill.bill_number;
}

/** Fisher–Yates copy — used by the Discover (shuffle) action. */
export function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const CARD_LIMIT = 24;

/** Normalise upstream data: guarantee an id, trim empties, cap volume. */
export function normaliseBills(raw: Bill[] | undefined | null): Bill[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((b) => b && (b.bill_number || b.title))
    .slice(0, 50)
    .map((b, i) => ({ ...b, id: `${b.id ?? b.source_id ?? "bill"}-${i}` }));
}

/* ---------- Bill identity, routing & official document links ----------
 * Detail routes use a stable identifier: congress / bill type / bill number,
 * e.g. /explore/bill/119/hr/10905, with an /explore/bill/id/... fallback for
 * records whose number cannot be parsed. Official-document priorities:
 *   1. GovInfo (official bill text)   2. Congress.gov   3. LegiScan reference
 * Per-record LegiScan text URLs are pinned for supplied reference records
 * only; every other bill gets honest search links instead of a fake mirror.
 */

export interface ParsedBill {
  billType: string; // canonical lowercase key: hr | s | hjres | sjres | hconres | sconres | hres | sres
  billTypeLabel: string; // e.g. "H.R."
  number: number;
  chamber: "House" | "Senate" | null;
}

const TYPE_TABLE: Array<{ re: RegExp; key: string; label: string; chamber: "House" | "Senate" }> = [
  { re: /^hjres/i, key: "hjres", label: "H.J.Res.", chamber: "House" },
  { re: /^sjres/i, key: "sjres", label: "S.J.Res.", chamber: "Senate" },
  { re: /^hconres/i, key: "hconres", label: "H.Con.Res.", chamber: "House" },
  { re: /^sconres/i, key: "sconres", label: "S.Con.Res.", chamber: "Senate" },
  { re: /^hres/i, key: "hres", label: "H.Res.", chamber: "House" },
  { re: /^sres/i, key: "sres", label: "S.Res.", chamber: "Senate" },
  { re: /^(hr|hb|ab)/i, key: "hr", label: "H.R.", chamber: "House" },
  { re: /^(sr|sb)/i, key: "s", label: "S.", chamber: "Senate" },
];

export function parseBillNumber(raw: string): ParsedBill | null {
  const compact = raw.replace(/[^a-z0-9.]/gi, "").replace(/\./g, "");
  const m = compact.match(/^([a-z]+)(\d+)$/i);
  if (!m) return null;
  const lead = m[1];
  const num = parseInt(m[2], 10);
  for (const t of TYPE_TABLE) {
    if (t.re.test(lead)) return { billType: t.key, billTypeLabel: t.label, number: num, chamber: t.chamber };
  }
  return null;
}

/** Congress number for a federal year (119th = 2025–2027). */
export function congressForYear(year: number): number {
  return Math.floor((year - 1789) / 2) + 1;
}

export function billDetailSlug(bill: Bill): string {
  const parsed = parseBillNumber(bill.bill_number);
  if (parsed && bill.level === "Federal") {
    let congress: number | null = null;
    const d = new Date(bill.introduced_date);
    if (!Number.isNaN(d.getTime())) congress = congressForYear(d.getFullYear());
    if (congress) return `${congress}/${parsed.billType}/${parsed.number}`;
  }
  return `id/${encodeURIComponent(String(bill.source_id ?? bill.id))}`;
}

export function billDetailHref(bill: Bill): string {
  return `/bills/${bill.source_id ?? bill.id}`;
}

/* ---------- Honest, fetch-free meta title for detail routes ---------- */

const TYPE_LABELS_SERVER: Record<string, string> = {
  hr: "H.R.",
  s: "S.",
  hjres: "H.J.Res.",
  sjres: "S.J.Res.",
  hconres: "H.Con.Res.",
  sconres: "S.Con.Res.",
  hres: "H.Res.",
  sres: "S.Res.",
};

/** Server-safe (lib, not client): used by generateMetadata. */
export function slugToMetaTitle(slug: string[]): string {
  const ordinal = (n: number): string => {
    const rem10 = n % 10;
    const rem100 = n % 100;
    if (rem10 === 1 && rem100 !== 11) return `${n}st`;
    if (rem10 === 2 && rem100 !== 12) return `${n}nd`;
    if (rem10 === 3 && rem100 !== 13) return `${n}rd`;
    return `${n}th`;
  };
  if (slug[0] === "id") return "Bill — CitizenShift";
  if (slug.length >= 3) {
    const [, type, num] = slug;
    const label = TYPE_LABELS_SERVER[type?.toLowerCase()] ?? type?.toUpperCase();
    const congress = Number.isInteger(Number(slug[0])) ? Number(slug[0]) : null;
    const cong = congress ? ` · ${ordinal(congress)} Congress` : "";
    return `${label ?? ""}${num ? ` ${num}` : ""}${cong} — CitizenShift`;
  }
  return "Bill — CitizenShift";
}

/* ---------- Official / reference document links ---------- */

export function congressGovSearchUrl(displayNumber: string): string | null {
  if (!displayNumber) return null;
  const q = encodeURIComponent(JSON.stringify({ source: "legislation", search: displayNumber }));
  return `https://www.congress.gov/search?q=${q}`;
}

export function govInfoSearchUrl(displayNumber: string): string | null {
  if (!displayNumber) return null;
  const q = encodeURIComponent(JSON.stringify({ query: displayNumber, facetType: "bills" }));
  return `https://www.govinfo.gov/app/search/${q}`;
}

function legiscanCompact(bill: Bill): string {
  return bill.bill_number.replace(/[^a-z0-9]/gi, "");
}

export function legiscanBillUrl(bill: Bill): string | null {
  if (bill.source.toLowerCase() !== "legiscan") return null;
  if (bill.level !== "Federal") return null;
  const parsed = parseBillNumber(bill.bill_number);
  const compact = legiscanCompact(bill);
  if (!parsed) return null;
  const d = new Date(bill.introduced_date);
  const year = Number.isNaN(d.getTime()) ? "" : String(d.getFullYear());
  return `https://legiscan.com/US/bill/${compact}${year ? `/${year}/` : ""}`;
}

/** Pinned full-text reference for supplied validation records (e.g. H.R. 10905). */
const LEGISCAN_TEXT_REFS: Record<string, string> = {
  HB10905: "https://legiscan.com/US/text/HB10905/id/3463878",
};

export function legiscanTextRefUrl(bill: Bill): string | null {
  // Prefer the record's own stored document URL; the pinned map only backs the
  // supplied validation sample when the upstream record omits it.
  const own = (bill.source_url ?? "").trim();
  if (/^https?:\/\/(www\.)?legiscan\.com\//i.test(own)) return own;
  return LEGISCAN_TEXT_REFS[legiscanCompact(bill)] ?? null;
}

export function billViewerHref(bill: Bill): string {
  return `${billDetailHref(bill)}/text`;
}

/* ---------- Legislative progress (conservative derivation) ---------- */

export type ProgressState = "completed" | "current" | "upcoming";

export interface ProgressMilestone {
  name: string;
  status: ProgressState;
}

export interface BillProgress {
  /** false when the record does not support an honest milestone bar */
  supported: boolean;
  milestones: ProgressMilestone[];
}

/**
 * Derive milestones ONLY from what the record's status actually says.
 * "Committee" is never inferred from elapsed time; it is only marked when the
 * upstream record explicitly includes it.
 */
export function deriveProgress(bill: Bill): BillProgress {
  const status = (bill.status || "").toLowerCase();
  const parsed = parseBillNumber(bill.bill_number);
  const houseOrigin = parsed?.chamber !== "Senate";

  const stages = ["Introduced", "Committee", houseOrigin ? "House" : "Senate", houseOrigin ? "Senate" : "House", "Enacted"];
  const done: string[] = ["Introduced"];

  if (!status || status === "introduced") {
    return {
      supported: true,
      milestones: stages.map((name) => ({ name, status: name === "Introduced" ? "current" : "upcoming" })),
    };
  }

  if (/\b(passed|engrossed|agreed to)\b/.test(status)) {
    // one chamber confirmed passed by the record.
    // The record does not say WHICH chamber beyond the bill's origin, so mark
    // the origin chamber complete and put the remaining chamber as current.
    done.push("Committee", houseOrigin ? "House" : "Senate");
    return {
      supported: true,
      milestones: stages.map((name) => ({
        name,
        status: done.includes(name)
          ? "completed"
          : name === "Enacted"
            ? "upcoming"
            : "current",
      })),
    };
  }

  if (/\b(enrolled|enacted|signed|presented)\b/.test(status)) {
    return {
      supported: true,
      milestones: stages.map((name) => ({ name, status: "completed" })),
    };
  }

  if (/\b(veto|failed|withdrawn)\b/.test(status)) {
    done.push("Committee", houseOrigin ? "House" : "Senate");
    return {
      supported: false,
      milestones: stages.map((name) => ({
        name,
        status: done.includes(name) ? "completed" : name === "Enacted" ? "upcoming" : "upcoming",
      })),
    };
  }

  // Unknown status wording — the bar could mislead, so decline it.
  return { supported: false, milestones: stages.map((name) => ({ name, status: "upcoming" } as ProgressMilestone)) };
}

/* ---------- Legislators (Contact Your Representative) ---------- */

export interface Legislator {
  name: string;
  district?: string;
  state?: string;
  title?: string;
  contact: string;
  phone?: string;
  email?: string;
  type?: "senator" | "representative";
}

export interface LegislatorLookupResponse {
  senators: Legislator[];
  houseRepresentatives: Legislator[];
  refreshedAt?: string;
}
