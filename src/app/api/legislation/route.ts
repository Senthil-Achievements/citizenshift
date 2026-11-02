/**
 * Server-side proxy for the live legislation feed.
 * The upstream CitizenShift bill service (LegiScan data + AI summaries) is never
 * exposed to the browser — visitors only talk to this domain.
 */

import { NextRequest, NextResponse } from "next/server";
import { normaliseBills } from "@/lib/legislation";

export const dynamic = "force-dynamic";

const UPSTREAM = process.env.LEGISLATION_UPSTREAM_URL ?? "https://citizenshift.vercel.app";
const TIMEOUT_MS = 30_000;

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
    if (!res.ok) {
      return NextResponse.json(
        { bills: [], availableLevels: ["Federal"], error: `upstream ${res.status}` },
        { status: 200 },
      );
    }
    const payload = (await res.json()) as {
      data?: { bills?: unknown; availableLevels?: string[] };
      bills?: unknown;
      availableLevels?: string[];
    };
    const inner = payload?.data ?? payload;
    return NextResponse.json(
      {
        bills: normaliseBills(inner?.bills as never),
        availableLevels: inner?.availableLevels?.length
          ? inner.availableLevels
          : ["Federal"],
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { bills: [], availableLevels: ["Federal"], error: "upstream-unreachable" },
      { status: 200 },
    );
  }
}
