/**
 * Server-side proxy for the live legislation feed.
 * The upstream CitizenShift bill service (LegiScan data + AI summaries) is never
 * exposed to the browser — visitors only talk to this domain.
 * Includes seamless fallback to the verified official 50-bill repository dataset
 * ensuring 100% zero-downtime reliability.
 */

import { NextRequest, NextResponse } from "next/server";
import { normaliseBills, type Bill } from "@/lib/legislation";
import localVerifiedBills from "@/data/verified-bills.json";

export const dynamic = "force-dynamic";

const RAW_UPSTREAM = process.env.LEGISLATION_UPSTREAM_URL ?? "https://citizenshift.vercel.app";
const UPSTREAM = RAW_UPSTREAM.trim().replace(/\/+$/, "");
const TIMEOUT_MS = 6_000;

function getFallbackBills(state: string, q: string): Bill[] {
  let list = localVerifiedBills as unknown as Bill[];
  if (q) {
    const query = q.toLowerCase();
    list = list.filter(
      (b) =>
        b.title?.toLowerCase().includes(query) ||
        b.bill_number?.toLowerCase().includes(query) ||
        b.summary?.toLowerCase().includes(query) ||
        b.policy_area?.toLowerCase().includes(query) ||
        (b as any).sponsors?.some((s: any) => s.name?.toLowerCase().includes(query)),
    );
  }
  // Federal legislation applies to all states; if state specified, include both state & federal bills
  if (state && state !== "ALL" && state !== "US") {
    const matching = list.filter((b) => (b as any).state === state || b.level === "Federal");
    if (matching.length) list = matching;
  }
  return normaliseBills(list);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const state = (searchParams.get("state") || "FL").toUpperCase().slice(0, 2);
  const q = (searchParams.get("q") || "").trim();

  const upstream = q
    ? `${UPSTREAM}/api/bills/search?state=${encodeURIComponent(state)}&q=${encodeURIComponent(q)}`
    : `${UPSTREAM}/api/recommendations?state=${encodeURIComponent(state)}`;

  try {
    const res = await fetch(upstream, {
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { accept: "application/json" },
    });
    if (res.ok) {
      const payload = (await res.json()) as {
        data?: { bills?: unknown; availableLevels?: string[] };
        bills?: unknown;
        availableLevels?: string[];
      };
      const inner = payload?.data ?? payload;
      const bills = normaliseBills(inner?.bills as never);
      if (bills && bills.length > 0) {
        return NextResponse.json(
          {
            bills,
            availableLevels: inner?.availableLevels?.length
              ? inner.availableLevels
              : ["Federal", "State"],
          },
          { headers: { "Cache-Control": "no-store" } },
        );
      }
    }
  } catch (err) {
    console.warn("Upstream legislation service fetch failed, falling back to verified bills:", err);
  }

  // Seamless fallback to our 50 verified official legislative bills
  const fallback = getFallbackBills(state, q);
  return NextResponse.json(
    {
      bills: fallback,
      availableLevels: ["Federal", "State"],
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
